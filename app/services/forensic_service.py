from typing import Any


class ForensicEngineService:
    def __init__(self, headers: dict[str, Any]):
        self.headers = headers

    def evaluate_alignment(self) -> dict[str, Any]:
        results = {
            "dmarc_pass": False,
            "spf_pass": False,
            "dkim_pass": False,
            "reply_to_mismatch": False,
            "technical_flag_score": 0.0,
            "risk_increasers": [],
            "risk_reducers": []
        }

        auth_results = self.headers.get("Authentication-Results")
        if auth_results:
            auth_str = str(auth_results).lower()
            if "dmarc=pass" in auth_str:
                results["dmarc_pass"] = True
            if "spf=pass" in auth_str:
                results["spf_pass"] = True
            if "dkim=pass" in auth_str:
                results["dkim_pass"] = True

        # Calculate technical flag score and record factors
        if not results["dmarc_pass"]:
            results["technical_flag_score"] += 15
            results["risk_increasers"].append({
                "factor": "DMARC authentication failed or unverified",
                "score": 15,
                "category": "Authentication"
            })
        else:
            results["risk_reducers"].append({
                "factor": "DMARC authentication verified",
                "score": -10,
                "category": "Authentication"
            })

        if not results["spf_pass"]:
            results["technical_flag_score"] += 10
            results["risk_increasers"].append({
                "factor": "SPF authentication failed or unverified",
                "score": 10,
                "category": "Authentication"
            })
        else:
            results["risk_reducers"].append({
                "factor": "SPF authentication verified",
                "score": -10,
                "category": "Authentication"
            })

        if not results["dkim_pass"]:
            results["technical_flag_score"] += 10
            results["risk_increasers"].append({
                "factor": "DKIM cryptographic signature missing or invalid",
                "score": 10,
                "category": "Authentication"
            })
        else:
            results["risk_reducers"].append({
                "factor": "DKIM cryptographic signature verified",
                "score": -10,
                "category": "Authentication"
            })

        # Check Reply-To mismatch
        sender = str(self.headers.get("From") or "").strip()
        reply_to = str(self.headers.get("Reply-To") or "").strip()
        
        # Extract domains if present
        import re
        from_dom = re.search(r'@([\w.-]+)', sender)
        reply_dom = re.search(r'@([\w.-]+)', reply_to)

        if reply_to and sender and (sender != reply_to and (not from_dom or not reply_dom or from_dom.group(1).lower() != reply_dom.group(1).lower())):
            results["reply_to_mismatch"] = True
            results["technical_flag_score"] += 20
            results["risk_increasers"].append({
                "factor": "Reply-To domain mismatch",
                "score": 20,
                "category": "Identity"
            })
        else:
            results["risk_reducers"].append({
                "factor": "Consistent sender and response routing",
                "score": -5,
                "category": "Identity"
            })

        return results

