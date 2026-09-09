import os
import httpx
import logging
import asyncio
from typing import List, Dict, Any

class OpenCTIService:
    _schema_fields = None

    @staticmethod
    async def _inspect_schema(client: httpx.AsyncClient, url: str, token: str) -> List[str]:
        if OpenCTIService._schema_fields is not None:
            return OpenCTIService._schema_fields

        introspection_query = """
        query {
          __type(name: "StixCyberObservable") {
            fields {
              name
            }
          }
        }
        """
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        try:
            response = await client.post(url, json={"query": introspection_query}, headers=headers, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            fields_data = data.get("data", {}).get("__type", {}).get("fields", [])
            if fields_data:
                # Extract simple scalar fields we care about
                available_fields = [f["name"] for f in fields_data]
                selected = []
                for field in ["id", "entity_type", "observable_value", "standard_id", "x_opencti_description", "x_opencti_score"]:
                    if field in available_fields:
                        selected.append(field)
                OpenCTIService._schema_fields = selected
                return selected
            return ["id", "entity_type", "observable_value"] # Fallback
        except Exception as e:
            logging.warning(f"OpenCTI schema introspection failed: {e}")
            return ["id", "entity_type", "observable_value"] # Minimum safe fallback

    @staticmethod
    async def _query_opencti(client: httpx.AsyncClient, url: str, token: str, search_term: str) -> Dict[str, Any]:
        fields = await OpenCTIService._inspect_schema(client, url, token)
        fields_str = "\n".join(fields)
        
        # We query stixCyberObservables. In OpenCTI, we use the search parameter.
        query = f"""
        query($search: String) {{
            stixCyberObservables(search: $search) {{
                edges {{
                    node {{
                        {fields_str}
                    }}
                }}
            }}
        }}
        """
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        try:
            response = await client.post(url, json={"query": query, "variables": {"search": search_term}}, headers=headers, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            edges = data.get("data", {}).get("stixCyberObservables", {}).get("edges", [])
            
            if edges:
                # Get the best match (or first match)
                first_node = edges[0].get("node", {})
                first_node["status"] = "success"
                return first_node
                
            return {"status": "not_found"}
        except Exception as e:
            logging.warning(f"OpenCTI connection error: {e}")
            return {"status": "unavailable"}

    @staticmethod
    async def enrich_iocs(indicators: List[Dict[str, Any]], attachments: List[Dict[str, Any]]) -> None:
        url = os.getenv("OPENCTI_URL")
        token = os.getenv("OPENCTI_TOKEN")
        
        if not url or not token:
            return

        async with httpx.AsyncClient() as client:
            tasks = []
            targets = []

            for ind in indicators:
                val = ind.get("value", "")
                if val:
                    tasks.append(OpenCTIService._query_opencti(client, url, token, val))
                    targets.append(ind)

            for att in attachments:
                sha256 = att.get("sha256")
                if sha256:
                    tasks.append(OpenCTIService._query_opencti(client, url, token, sha256))
                    targets.append(att)

            if not tasks:
                return

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for target, result in zip(targets, results):
                if isinstance(result, Exception):
                    logging.warning(f"OpenCTI task exception: {result}")
                    intel = {"status": "error", "message": "Task exception"}
                else:
                    intel = result

                if intel.get("status") in ["success", "unavailable"]:
                    if "opencti_intel" not in target:
                        target["opencti_intel"] = intel
                    else:
                        target["opencti_intel"].update(intel)
