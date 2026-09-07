import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_analyze_malformed_email():
    """
    Test that uploading a malformed email file safely returns 422
    without exposing internal stack traces.
    """
    # Create a dummy payload that isn't a valid EML
    payload = b"This is not a valid email file at all..."
    
    files = {"file": ("malformed.eml", payload, "message/rfc822")}
    response = client.post("/api/v1/analyze", files=files)
    
    # We expect 422 Unprocessable Entity
    assert response.status_code == 422
    assert "malformed or invalid" in response.json().get("detail", "").lower()

@patch('app.api.routes.analyze.EmailParserService.parse_all')
def test_analyze_internal_error(mock_parse):
    """
    Test that unexpected exceptions are handled safely with a 500 error
    and a Reference ID, rather than exposing stack traces.
    """
    mock_parse.side_effect = Exception("Some crazy internal DB failure")
    
    payload = b"Subject: Valid Email\r\n\r\nBody"
    files = {"file": ("test.eml", payload, "message/rfc822")}
    
    response = client.post("/api/v1/analyze", files=files)
    
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data
    assert "internal error occurred" in data["detail"].lower()
    assert "Reference ID" in data["detail"]
    assert "crazy internal" not in data["detail"]

@patch('app.services.threat_intel_service.httpx.AsyncClient.get')
def test_threat_intel_unavailable(mock_get):
    """
    Test that the threat intelligence service gracefully degrades when
    external APIs timeout or are unavailable.
    """
    import httpx
    # Simulate a timeout
    mock_get.side_effect = httpx.RequestError("Connection timeout")
    
    from app.services.threat_intel_service import ThreatIntelService
    import asyncio
    
    indicators = [{"type": "URL", "value": "http://evil.com"}]
    
    # Needs API key to actually run the check
    import os
    os.environ["VIRUSTOTAL_API_KEY"] = "dummy_key"
    
    result = asyncio.run(ThreatIntelService.enrich_indicators(indicators))
    
    # It should still return the indicator, but with a safe error reputation
    assert len(result) == 1
    assert result[0]["reputation"]["status"] == "failed"
    assert result[0]["reputation"]["error"] == "Service unavailable or timeout"

