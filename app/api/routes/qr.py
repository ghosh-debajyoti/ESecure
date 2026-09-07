from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Any

from app.services.image_service import ImageAnalysisService
from app.schemas.image import ImageAnalysisResult

router = APIRouter()

@router.post("/qr-scan", response_model=ImageAnalysisResult)
async def scan_qr_image(file: UploadFile = File(...)) -> Any:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        image_bytes = await file.read()
        result = await ImageAnalysisService.analyze_image(image_bytes, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
