from fastapi import APIRouter, File, HTTPException, UploadFile
import traceback

from app.schemas.thread import ThreadContinuityResult
from app.services.parser_service import EmailParserService
from app.services.thread_service import ThreadContinuityService

router = APIRouter()

@router.post("/thread-check", response_model=ThreadContinuityResult)
async def check_thread_continuity(file: UploadFile = File(...)):
    if not file.filename.endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are supported")
        
    try:
        raw_bytes = await file.read()
        
        parser = EmailParserService(raw_bytes)
        parsed = parser.parse_all()
        
        result = ThreadContinuityService.analyze_thread(parsed.headers, parsed.body)
        return result
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during thread analysis: {e!s}")
