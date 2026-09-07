from typing import Any
from pydantic import BaseModel

class ImageAnalysisResult(BaseModel):
    filename: str
    detected_text: str
    qr_urls: list[str]
    threat_indicators: list[dict[str, Any]]
    is_suspicious: bool
    risk_score: float
