from app.services.spoofed_service import SpoofedAccountService

def test_classify_legitimate():
    alignment = {
        "dmarc_pass": True,
        "spf_pass": True,
        "dkim_pass": True,
        "reply_to_mismatch": False,
    }
    lookalikes = []
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=False,
        has_severe_threat=False
    )
    assert result == "LEGITIMATE"

def test_classify_spoofed_with_lookalike():
    alignment = {
        "dmarc_pass": False,
        "spf_pass": False,
        "dkim_pass": False,
        "reply_to_mismatch": False,
    }
    lookalikes = [{"type": "LOOKALIKE_DOMAIN", "domain": "gmaiil.com"}]
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=False,
        has_severe_threat=False
    )
    assert result == "SPOOFED"

def test_classify_spoofed_with_reply_mismatch():
    alignment = {
        "dmarc_pass": False,
        "spf_pass": False,
        "dkim_pass": False,
        "reply_to_mismatch": True,
    }
    lookalikes = []
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=False,
        has_severe_threat=False
    )
    assert result == "SPOOFED"

def test_classify_possibly_compromised_severe_threat():
    # Pass DMARC/SPF, meaning it originated from legitimate infrastructure
    alignment = {
        "dmarc_pass": True,
        "spf_pass": True,
        "dkim_pass": True,
        "reply_to_mismatch": False,
    }
    lookalikes = []
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=False,
        has_severe_threat=True
    )
    assert result == "POSSIBLY_COMPROMISED"

def test_classify_possibly_compromised_campaign():
    alignment = {
        "dmarc_pass": True,
        "spf_pass": True,
        "dkim_pass": True,
        "reply_to_mismatch": False,
    }
    lookalikes = []
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=True,
        has_severe_threat=False
    )
    assert result == "POSSIBLY_COMPROMISED"

def test_classify_unknown():
    # Failed auth but no lookalikes or reply-to mismatch
    alignment = {
        "dmarc_pass": False,
        "spf_pass": False,
        "dkim_pass": False,
        "reply_to_mismatch": False,
    }
    lookalikes = []
    
    result = SpoofedAccountService.classify_account(
        alignment=alignment,
        lookalikes=lookalikes,
        is_coordinated_campaign=False,
        has_severe_threat=True
    )
    assert result == "UNKNOWN"
