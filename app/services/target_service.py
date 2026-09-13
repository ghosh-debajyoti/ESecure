import re
from typing import Optional, Dict

class TargetService:
    DEPARTMENT_KEYWORDS = {
        'finance', 'hr', 'billing', 'admin', 'support', 'sales', 'marketing',
        'info', 'contact', 'legal', 'security', 'it', 'helpdesk', 'payroll'
    }

    @staticmethod
    def infer_target_info(headers: dict) -> Dict[str, Optional[str]]:
        """
        Extracts and normalizes the target email address and infers its type.
        Uses To, Delivered-To, or X-Original-To.
        """
        raw_target = (
            headers.get("Delivered-To") or 
            headers.get("X-Original-To") or 
            headers.get("To") or 
            ""
        )
        
        if isinstance(raw_target, list):
            raw_target = raw_target[0]
            
        raw_target = str(raw_target)
        
        # Extract email address between < > or just the raw string if no < >
        match = re.search(r'<([^>]+)>', raw_target)
        email_addr = match.group(1).lower().strip() if match else raw_target.lower().strip()
        
        # Clean up in case there are multiple emails or trailing quotes
        email_addr = email_addr.split(',')[0].strip(' "\'')
        
        if not email_addr or '@' not in email_addr:
            return {
                "target_email": "unknown",
                "target_type": "Unknown Target",
                "likely_department": None
            }
            
        username = email_addr.split('@')[0]
        
        # Department inference heuristic
        is_department = any(kw in username for kw in TargetService.DEPARTMENT_KEYWORDS)
        
        if is_department:
            # e.g. "finance" -> "Finance"
            matched_kw = next((kw for kw in TargetService.DEPARTMENT_KEYWORDS if kw in username), None)
            dept_name = matched_kw.capitalize() if matched_kw else "Department"
            return {
                "target_email": email_addr,
                "target_type": "Likely Department",
                "likely_department": dept_name
            }
        
        return {
            "target_email": email_addr,
            "target_type": "Employee Target",
            "likely_department": None
        }
