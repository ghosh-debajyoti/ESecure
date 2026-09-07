import asyncio
import base64
import os
import re
import logging
from typing import Any

import httpx
from cachetools import TTLCache

# In-memory cache for VT results to avoid rate limits (TTL = 10 mins)
vt_cache = TTLCache(maxsize=1000, ttl=600)

class ThreatIntelService:
    @staticmethod
    def _base64_encode_url(url: str) -> str:
        """VirusTotal v3 requires URLs to be base64 encoded without padding."""
        return base64.urlsafe_b64encode(url.encode()).decode().strip("=")

    @staticmethod
    async def _check_vt_url(client: httpx.AsyncClient, url: str, api_key: str) -> dict[str, Any]:
        if url in vt_cache:
            return vt_cache[url]

        encoded_url = ThreatIntelService._base64_encode_url(url)
        headers = {"x-apikey": api_key}
        try:
            response = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{encoded_url}",
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious_votes = stats.get("malicious", 0) + stats.get("suspicious", 0)
                total_engines = sum(stats.values()) if stats else 0
                
                result = {
                    "source": "VirusTotal",
                    "malicious_votes": malicious_votes,
                    "total_engines": total_engines,
                    "is_flagged": malicious_votes >= 3,
                    "status": "success"
                }
                vt_cache[url] = result
                return result
            else:
                return {"source": "VirusTotal", "error": f"HTTP {response.status_code}", "status": "failed"}
        except httpx.RequestError as e:
            logging.warning(f"Threat intel service request error for VT URL: {e}")
            return {"source": "VirusTotal", "error": "Service unavailable or timeout", "status": "failed"}
        except Exception as e:
            logging.error(f"Unexpected error checking VT URL: {e}")
            return {"source": "VirusTotal", "error": "Internal error", "status": "failed"}

    @staticmethod
    async def _check_vt_ip(client: httpx.AsyncClient, ip: str, api_key: str) -> dict[str, Any]:
        if ip in vt_cache:
            return vt_cache[ip]

        headers = {"x-apikey": api_key}
        try:
            response = await client.get(
                f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious_votes = stats.get("malicious", 0) + stats.get("suspicious", 0)
                total_engines = sum(stats.values()) if stats else 0
                
                result = {
                    "source": "VirusTotal",
                    "malicious_votes": malicious_votes,
                    "total_engines": total_engines,
                    "is_flagged": malicious_votes >= 3,
                    "status": "success"
                }
                vt_cache[ip] = result
                return result
            else:
                return {"source": "VirusTotal", "error": f"HTTP {response.status_code}", "status": "failed"}
        except httpx.RequestError as e:
            logging.warning(f"Threat intel service request error for VT IP: {e}")
            return {"source": "VirusTotal", "error": "Service unavailable or timeout", "status": "failed"}
        except Exception as e:
            logging.error(f"Unexpected error checking VT IP: {e}")
            return {"source": "VirusTotal", "error": "Internal error", "status": "failed"}

    @staticmethod
    async def enrich_indicators(indicators: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Takes a list of indicators and queries external threat intelligence APIs to enrich them.
        Modifies indicators in-place and returns the list.
        """
        vt_api_key = os.getenv("VIRUSTOTAL_API_KEY")
        phishtank_api_key = os.getenv("PHISHTANK_API_KEY")
        
        # If VT API key is missing, return unverified
        if not vt_api_key:
            for ind in indicators:
                ind["reputation"] = {
                    "source": "None",
                    "status": "unverified",
                    "message": "Missing API keys"
                }
            return indicators

        async with httpx.AsyncClient() as client:
            tasks = []
            for ind in indicators:
                ind_type = ind.get("type", "").upper()
                val = ind.get("value", "")
                
                if ind_type == "URL":
                    tasks.append(ThreatIntelService._check_vt_url(client, val, vt_api_key))
                elif ind_type == "IP":
                    tasks.append(ThreatIntelService._check_vt_ip(client, val, vt_api_key))
                elif ind_type == "DOMAIN":
                    # VT Domain endpoint is /api/v3/domains/{domain}
                    # We can use the URL checker for domains as well if prefixed, but let's just use the domain endpoint
                    # For simplicity in this assignment, checking domain as a URL or a specific domain endpoint
                    # Let's write a quick inline handler for domains or default to unverified
                    url_val = f"http://{val}" if not val.startswith("http") else val
                    tasks.append(ThreatIntelService._check_vt_url(client, url_val, vt_api_key))
                else:
                    async def dummy_result():
                        return {"source": "None", "status": "unsupported_type"}
                    tasks.append(dummy_result())
            
            # Execute all external calls concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for ind, result in zip(indicators, results):
                if isinstance(result, Exception):
                    ind["reputation"] = {"source": "VirusTotal", "status": "error", "error": str(result)}
                else:
                    ind["reputation"] = result

        return indicators
