import os
import httpx
import logging
import asyncio
from typing import List, Dict, Any

class ThreatFoxService:
    BASE_URL = "https://threatfox-api.abuse.ch/api/v1/"
    
    @staticmethod
    async def _query_threatfox(client: httpx.AsyncClient, api_key: str, query_type: str, search_term: str) -> Dict[str, Any]:
        payload = {
            "query": query_type,
            "search_term": search_term
        }
        headers = {
            "Auth-Key": api_key,
            "Content-Type": "application/json"
        }
        try:
            response = await client.post(ThreatFoxService.BASE_URL, json=payload, headers=headers, timeout=5.0)
            if response.status_code == 429:
                return {"status": "rate_limited"}
            
            response.raise_for_status()
            data = response.json()
            
            if data.get("query_status") == "ok" and data.get("data"):
                results = data["data"]
                if results and isinstance(results, list):
                    first_match = results[0]
                    return {
                        "status": "success",
                        "threat_type": first_match.get("threat_type"),
                        "malware_alias": first_match.get("malware_alias"),
                        "confidence_level": first_match.get("confidence_level"),
                        "tags": first_match.get("tags", []),
                        "reporter": first_match.get("reporter")
                    }
            return {"status": "not_found"}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                return {"status": "rate_limited"}
            logging.warning(f"ThreatFox HTTP error: {e}")
            return {"status": "error", "message": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logging.warning(f"ThreatFox connection error: {e}")
            return {"status": "unavailable"}

    @staticmethod
    async def enrich_iocs(indicators: List[Dict[str, Any]], attachments: List[Dict[str, Any]]) -> None:
        api_key = os.getenv("THREATFOX_API_KEY")
        if not api_key:
            return

        async with httpx.AsyncClient() as client:
            tasks = []
            targets = []

            for ind in indicators:
                ind_type = ind.get("type", "").upper()
                val = ind.get("value", "")
                if ind_type in ["IP", "DOMAIN", "URL"] and val:
                    tasks.append(ThreatFoxService._query_threatfox(client, api_key, "search_ioc", val))
                    targets.append(ind)

            for att in attachments:
                sha256 = att.get("sha256")
                if sha256:
                    tasks.append(ThreatFoxService._query_threatfox(client, api_key, "search_hash", sha256))
                    targets.append(att)

            if not tasks:
                return

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for target, result in zip(targets, results):
                if isinstance(result, Exception):
                    logging.warning(f"ThreatFox task exception: {result}")
                    intel = {"status": "error", "message": "Task exception"}
                else:
                    intel = result

                if intel.get("status") in ["success", "rate_limited", "unavailable"]:
                    if "threatfox_intel" not in target:
                        target["threatfox_intel"] = intel
                    else:
                        target["threatfox_intel"].update(intel)
