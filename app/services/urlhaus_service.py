import os
import httpx
import logging
import asyncio
from typing import List, Dict, Any

class UrlhausService:
    BASE_URL = "https://urlhaus-api.abuse.ch/v1/url/"
    
    @staticmethod
    async def _query_urlhaus(client: httpx.AsyncClient, api_key: str, url: str) -> Dict[str, Any]:
        payload = {
            "url": url
        }
        headers = {}
        if api_key:
            headers["Auth-Key"] = api_key
            
        try:
            # application/x-www-form-urlencoded
            response = await client.post(UrlhausService.BASE_URL, data=payload, headers=headers, timeout=5.0)
            if response.status_code == 429:
                return {"status": "rate_limited"}
            
            response.raise_for_status()
            data = response.json()
            
            if data.get("query_status") == "ok":
                return {
                    "status": "success",
                    "threat": data.get("threat"),
                    "url_status": data.get("url_status"),
                    "host": data.get("host"),
                    "first_seen": data.get("date_added"),
                    "last_seen": data.get("last_online"),
                    "tags": data.get("tags", []),
                    "reporter": data.get("reporter")
                }
            return {"status": "not_found"}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                return {"status": "rate_limited"}
            logging.warning(f"URLhaus HTTP error: {e}")
            return {"status": "error", "message": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logging.warning(f"URLhaus connection error: {e}")
            return {"status": "unavailable"}

    @staticmethod
    async def enrich_urls(indicators: List[Dict[str, Any]]) -> None:
        api_key = os.getenv("URLHAUS_API_KEY", "")
        # API key is optional for some URLhaus endpoints, but let's pass it if available.

        async with httpx.AsyncClient() as client:
            tasks = []
            targets = []

            for ind in indicators:
                ind_type = ind.get("type", "").upper()
                val = ind.get("value", "")
                if ind_type == "URL" and val:
                    tasks.append(UrlhausService._query_urlhaus(client, api_key, val))
                    targets.append(ind)

            if not tasks:
                return

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for target, result in zip(targets, results):
                if isinstance(result, Exception):
                    logging.warning(f"URLhaus task exception: {result}")
                    intel = {"status": "error", "message": "Task exception"}
                else:
                    intel = result

                if intel.get("status") in ["success", "rate_limited", "unavailable"]:
                    if "urlhaus_intel" not in target:
                        target["urlhaus_intel"] = intel
                    else:
                        target["urlhaus_intel"].update(intel)
