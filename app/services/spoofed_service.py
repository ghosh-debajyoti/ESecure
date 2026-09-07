from typing import Any

class SpoofedAccountService:
    @staticmethod
    def classify_account(
        alignment: dict[str, Any],
        lookalikes: list[dict[str, Any]],
        is_coordinated_campaign: bool,
        has_severe_threat: bool
    ) -> str:
        """
        Classifies an email as SPOOFED, POSSIBLY_COMPROMISED, LEGITIMATE, or UNKNOWN.
        """
        dmarc_pass = alignment.get("dmarc_pass", False)
        spf_pass = alignment.get("spf_pass", False)
        dkim_pass = alignment.get("dkim_pass", False)
        reply_mismatch = alignment.get("reply_to_mismatch", False)
        
        has_lookalike = len(lookalikes) > 0
        
        # Determine authentication alignment
        is_authenticated = dmarc_pass and (spf_pass or dkim_pass)
        is_unauthenticated = not is_authenticated

        # 1. SPOOFED classification
        if is_unauthenticated and (has_lookalike or reply_mismatch):
            return "SPOOFED"

        # 2. POSSIBLY_COMPROMISED classification
        if is_authenticated and (is_coordinated_campaign or has_severe_threat):
            return "POSSIBLY_COMPROMISED"

        # 3. LEGITIMATE classification
        if is_authenticated and not has_lookalike and not reply_mismatch and not has_severe_threat and not is_coordinated_campaign:
            return "LEGITIMATE"

        # 4. UNKNOWN classification
        return "UNKNOWN"
