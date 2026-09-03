import email
from email.message import EmailMessage
import re
import ipaddress
import httpx
from datetime import datetime
from email.utils import parsedate_to_datetime

class RelayService:
    @staticmethod
    async def analyze_route(msg: EmailMessage) -> list[dict]:
        received_headers = msg.get_all("Received") or []
        routes = []
        
        from_re = re.compile(r'from\s+([^\s]+)')
        ip_re = re.compile(r'\[([0-9a-fA-F\.\:]+)\]')
        
        async with httpx.AsyncClient() as client:
            # Headers are reverse chronological. Reverse to get origin first.
            for i, header in enumerate(reversed(received_headers)):
                h = str(header).replace('\n', ' ').replace('\r', '')
                f_m = from_re.search(h)
                ip_m = ip_re.search(h)
                ts_str = h.rsplit(';', 1)[-1].strip() if ';' in h else None
                
                dt = None
                if ts_str:
                    try:
                        dt = parsedate_to_datetime(ts_str)
                    except Exception:
                        pass
                
                ip = ip_m.group(1) if ip_m else None
                server_name = f_m.group(1) if f_m else None
                
                hop = {
                    "hop_number": i + 1,
                    "ip_address": ip,
                    "server_name": server_name,
                    "country": None,
                    "city": None,
                    "isp": None,
                    "timestamp": dt.isoformat() if dt else ts_str,
                    "delay_seconds": 0.0
                }
                
                if ip:
                    try:
                        ip_obj = ipaddress.ip_address(ip)
                        if not ip_obj.is_private and not ip_obj.is_loopback:
                            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,city,isp")
                            if resp.status_code == 200:
                                data = resp.json()
                                if data.get("status") == "success":
                                    hop["country"] = data.get("country")
                                    hop["city"] = data.get("city")
                                    hop["isp"] = data.get("isp")
                    except Exception as e:
                        print(f"GeoIP failed for {ip}: {e}")
                
                routes.append(hop)
                
            # Calculate delays
            for i in range(1, len(routes)):
                prev = routes[i-1]
                curr = routes[i]
                if prev["timestamp"] and curr["timestamp"]:
                    try:
                        prev_dt = datetime.fromisoformat(prev["timestamp"])
                        curr_dt = datetime.fromisoformat(curr["timestamp"])
                        delay = (curr_dt - prev_dt).total_seconds()
                        curr["delay_seconds"] = delay if delay >= 0 else 0.0
                    except Exception:
                        pass
                        
        return routes
