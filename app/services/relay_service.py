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
                    "region": None,
                    "city": None,
                    "isp": None,
                    "asn": None,
                    "enrichment_status": "not_extracted" if not ip else "unavailable",
                    "enrichment_reason": "No IP address was extracted from this Received header." if not ip else "The enrichment lookup has not completed.",
                    "timestamp": dt.isoformat() if dt else ts_str,
                    "delay_seconds": 0.0
                }
                
                if ip:
                    try:
                        ip_obj = ipaddress.ip_address(ip)
                        if not ip_obj.is_global:
                            hop["enrichment_status"] = "no_data"
                            hop["enrichment_reason"] = "The extracted address is not globally routable, so no external enrichment was requested."
                        else:
                            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,isp,as,lat,lon")
                            if resp.status_code != 200:
                                hop["enrichment_status"] = "unavailable"
                                hop["enrichment_reason"] = "The enrichment service did not complete the lookup."
                            else:
                                data = resp.json()
                                if data.get("status") == "success":
                                    hop["country"] = data.get("country")
                                    hop["region"] = data.get("regionName")
                                    hop["city"] = data.get("city")
                                    hop["isp"] = data.get("isp")
                                    hop["asn"] = data.get("as")
                                    hop["latitude"] = data.get("lat")
                                    hop["longitude"] = data.get("lon")
                                    hop["enrichment_status"] = "available"
                                    hop["enrichment_reason"] = "Enrichment data was returned for this address."
                                else:
                                    hop["enrichment_status"] = "no_data"
                                    hop["enrichment_reason"] = "No enrichment data was returned for this address."
                    except ValueError:
                        hop["enrichment_status"] = "no_data"
                        hop["enrichment_reason"] = "The extracted value is not a valid IP address."
                    except Exception as e:
                        hop["enrichment_status"] = "unavailable"
                        hop["enrichment_reason"] = "The enrichment service could not be reached for this address."
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
