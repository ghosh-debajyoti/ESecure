import pytest
from unittest.mock import patch, MagicMock
from app.services.image_service import ImageAnalysisService
from app.api.routes.qr import scan_qr_image
from fastapi import UploadFile

@pytest.mark.asyncio
@patch("app.services.image_service.decode")
@patch("app.services.image_service.pytesseract")
@patch("app.services.image_service.Image")
@patch("app.services.threat_intel_service.ThreatIntelService.enrich_indicators")
async def test_analyze_image(mock_enrich, mock_image, mock_tesseract, mock_decode):
    # Mocking Image.open
    mock_img_instance = MagicMock()
    mock_image.open.return_value = mock_img_instance
    
    # Mocking pyzbar decode
    mock_obj = MagicMock()
    mock_obj.data = b"http://malicious-qr.com/login"
    mock_decode.return_value = [mock_obj]
    
    # Mocking pytesseract OCR
    mock_tesseract.image_to_string.return_value = "Scan this code to visit https://other-link.com"
    
    # Mocking ThreatIntelService
    mock_enrich.return_value = [
        {"value": "http://malicious-qr.com/login", "reputation": {"is_flagged": True}},
        {"value": "https://other-link.com", "reputation": {"is_flagged": False}}
    ]
    
    result = await ImageAnalysisService.analyze_image(b"fake_image_bytes", "test.png")
    
    assert result.filename == "test.png"
    assert "Scan this code" in result.detected_text
    assert "http://malicious-qr.com/login" in result.qr_urls
    assert "https://other-link.com" in result.qr_urls
    assert result.is_suspicious is True
    assert result.risk_score == 40.0
    assert len(result.threat_indicators) == 2
    
@pytest.mark.asyncio
@patch("app.api.routes.qr.ImageAnalysisService.analyze_image")
async def test_qr_scan_endpoint(mock_analyze):
    mock_analyze.return_value = {
        "filename": "test.png",
        "detected_text": "hello",
        "qr_urls": [],
        "threat_indicators": [],
        "is_suspicious": False,
        "risk_score": 0.0
    }
    
    mock_file = MagicMock(spec=UploadFile)
    mock_file.content_type = "image/png"
    mock_file.filename = "test.png"
    mock_file.read = MagicMock()
    
    # Needs to be awaitable
    async def mock_read():
        return b"fake"
    mock_file.read.side_effect = mock_read
    
    response = await scan_qr_image(mock_file)
    assert response["filename"] == "test.png"
