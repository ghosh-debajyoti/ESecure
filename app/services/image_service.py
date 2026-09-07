import os
import io
import re
import asyncio
import logging
from typing import Any
from email.message import EmailMessage

# Patch library path for Mac users who installed zbar via brew
os.environ["DYLD_LIBRARY_PATH"] = "/opt/homebrew/lib:" + os.environ.get("DYLD_LIBRARY_PATH", "")

try:
    from PIL import Image, UnidentifiedImageError
except ImportError:
    Image = None
    UnidentifiedImageError = Exception

try:
    from pyzbar.pyzbar import decode
except ImportError as e:
    print(f"Warning: pyzbar not found or library missing. {e}")
    decode = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

from app.schemas.image import ImageAnalysisResult
from app.services.intel_service import IntelService
from app.services.threat_intel_service import ThreatIntelService


class ImageAnalysisService:
    @classmethod
    async def analyze_image(cls, image_bytes: bytes, filename: str = "unknown") -> ImageAnalysisResult:
        detected_text = ""
        qr_urls = []
        threat_indicators = []
        is_suspicious = False
        risk_score = 0.0
        
        if not Image:
            return ImageAnalysisResult(
                filename=filename,
                detected_text="",
                qr_urls=[],
                threat_indicators=[{"type": "Error", "value": "Pillow not installed"}],
                is_suspicious=False,
                risk_score=0.0
            )
            
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # QR Code Decoding
            if decode:
                decoded_objects = decode(img)
                for obj in decoded_objects:
                    data = obj.data.decode("utf-8")
                    if data.startswith("http"):
                        qr_urls.append(data)
                        
            # OCR text extraction
            if pytesseract:
                detected_text = pytesseract.image_to_string(img)
                # Find URLs in OCR text
                urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', detected_text)
                qr_urls.extend([u for u in urls if u not in qr_urls])

            # Deduplicate URLs
            qr_urls = list(set(qr_urls))
            
            # Analyze extracted URLs
            indicators_to_check = [{"type": "URL", "value": url} for url in qr_urls]
            
            if indicators_to_check:
                enriched_indicators = await ThreatIntelService.enrich_indicators(indicators_to_check)
                
                for ind in enriched_indicators:
                    if ind.get("reputation", {}).get("is_flagged", False):
                        is_suspicious = True
                        risk_score += 40.0
                        threat_indicators.append({
                            "type": "Malicious URL in Image",
                            "value": ind["value"],
                            "details": ind["reputation"]
                        })
                    else:
                        threat_indicators.append({
                            "type": "URL in Image",
                            "value": ind["value"],
                            "details": "Clean or unknown"
                        })
                        
        except UnidentifiedImageError:
            logging.warning(f"Unidentified image format or corrupted image: {filename}")
        except Exception as e:
            logging.error(f"Failed to analyze image {filename} due to internal error: {e}", exc_info=True)
            
        return ImageAnalysisResult(
            filename=filename,
            detected_text=detected_text,
            qr_urls=qr_urls,
            threat_indicators=threat_indicators,
            is_suspicious=is_suspicious,
            risk_score=min(100.0, risk_score)
        )

    @classmethod
    async def extract_and_analyze_images(cls, msg: EmailMessage) -> list[ImageAnalysisResult]:
        results = []
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type.startswith("image/"):
                payload = part.get_payload(decode=True)
                if payload:
                    filename = part.get_filename() or f"image_{len(results)}.png"
                    result = await cls.analyze_image(payload, filename)
                    results.append(result)
        return results
