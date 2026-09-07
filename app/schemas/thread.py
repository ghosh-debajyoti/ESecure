from typing import List

from pydantic import BaseModel

class ThreadFinding(BaseModel):
    type: str
    description: str
    severity: str

class ThreadContinuityResult(BaseModel):
    is_reply: bool
    is_suspicious: bool
    confidence: float
    findings: List[ThreadFinding]
