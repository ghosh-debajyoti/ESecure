import re

class FraudTypeService:
    """
    Transparent heuristic classifier to categorize fraud types based on email content patterns.
    This acts alongside the ML pipeline since the ML model is binary.
    """

    CATEGORIES = [
        "Spear Phishing",
        "Business Email Compromise (BEC)",
        "Advance Fee Scam",
        "Fake Invoice Fraud",
        "Tech Support Scam",
        "Job Offer Scam",
        "Charity Scam",
        "Phishing",
        "Other/Unclassified"
    ]

    @staticmethod
    def classify_fraud_type(body: str, subject: str) -> str:
        text = f"{subject} {body}".lower()

        # Business Email Compromise (BEC)
        if re.search(r'\b(wire transfer|bank details|urgent payment|invoice attached|process this payment|gift card|wire instructions)\b', text):
            if re.search(r'\b(ceo|cfo|president|director|executive)\b', text) or re.search(r'\b(confidential|urgent|secret|do not discuss)\b', text):
                return "Business Email Compromise (BEC)"
        
        # Fake Invoice Fraud
        if re.search(r'\b(invoice|billing|receipt|payment overdue|outstanding balance|remittance)\b', text):
            if re.search(r'\b(attached|download|click here to view|pdf|document)\b', text):
                return "Fake Invoice Fraud"

        # Advance Fee Scam
        if re.search(r'\b(inheritance|lottery|million|usd|won|beneficiary|transfer to your account)\b', text) and re.search(r'\b(fee|taxes|western union|crypto|bitcoin|upfront)\b', text):
            return "Advance Fee Scam"
            
        # Tech Support Scam
        if re.search(r'\b(microsoft|apple|amazon|geek squad|mcafee|norton)\b', text) and re.search(r'\b(renew|subscription|refund|virus|infected|call us immediately|toll-free|support team)\b', text):
            return "Tech Support Scam"
            
        # Job Offer Scam
        if re.search(r'\b(job offer|work from home|part time|salary|hiring)\b', text) and re.search(r'\b(no experience|guaranteed|deposit|start immediately|whatsapp)\b', text):
            return "Job Offer Scam"
            
        # Charity Scam
        if re.search(r'\b(donation|charity|orphan|relief|victim|disaster|help us)\b', text) and re.search(r'\b(crypto|bitcoin|western union|wire)\b', text):
            return "Charity Scam"

        # Spear Phishing (highly targeted)
        if re.search(r'\b(payroll|hr department|employee benefits|w2|tax document)\b', text):
            return "Spear Phishing"

        # Generic Phishing
        if re.search(r'\b(verify your account|update your payment|account suspended|password expiration|unauthorized login attempt|verify immediately)\b', text):
            return "Phishing"

        return "Other/Unclassified"
