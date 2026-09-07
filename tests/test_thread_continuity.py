import pytest
from app.services.thread_service import ThreadContinuityService
from app.schemas.thread import ThreadContinuityResult

def test_valid_reply_thread():
    headers = {
        "Subject": "Re: Project Update",
        "In-Reply-To": "<12345@example.com>",
        "References": "<12345@example.com>"
    }
    body = """
    Thanks for the update.
    
    > On Jan 1, 2023, at 10:00 AM, Bob wrote:
    > Here is the project update.
    """
    
    result = ThreadContinuityService.analyze_thread(headers, body)
    assert result.is_reply is True
    assert result.is_suspicious is False
    assert any(f.type == "VALID_THREAD" for f in result.findings)

def test_forged_reply_thread():
    headers = {
        "Subject": "Re: Invoice #12345",
        # Missing In-Reply-To and References
    }
    body = """
    Please see the attached invoice.
    
    > Original Message:
    > From: billing@example.com
    > Subject: Invoice #12345
    """
    
    result = ThreadContinuityService.analyze_thread(headers, body)
    assert result.is_reply is False # since there are no thread headers
    assert result.is_suspicious is True
    assert any(f.type == "FORGED_REPLY" for f in result.findings)
    assert result.confidence == 0.9

def test_broken_thread():
    headers = {
        "Subject": "Re: Project Update",
        "In-Reply-To": "<12345@example.com>",
    }
    body = """
    Thanks for the update. Let's talk tomorrow.
    """
    # Missing quoted text but has In-Reply-To
    
    result = ThreadContinuityService.analyze_thread(headers, body)
    assert result.is_reply is True
    assert result.is_suspicious is True
    assert any(f.type == "BROKEN_THREAD" for f in result.findings)
    assert result.confidence == 0.8

def test_normal_email_not_reply():
    headers = {
        "Subject": "Project Update",
    }
    body = """
    Here is the project update.
    """
    
    result = ThreadContinuityService.analyze_thread(headers, body)
    assert result.is_reply is False
    assert result.is_suspicious is False
    assert len(result.findings) == 0
