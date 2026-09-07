from datetime import datetime
from typing import Any

from pydantic import BaseModel


class TraceBase(BaseModel):
    headers: dict[str, Any]
    relay_route: list[dict[str, Any]] = []
    body: str | None = None

class PropertyBase(BaseModel):
    indicators: list[dict[str, Any]] = []
    attachments: list[dict[str, Any]] = []
    mime_boundaries: list[str] = []
    tlsh_hash: str | None = None

class AssertionBase(BaseModel):
    threat_score: float
    severity: str = "LOW"
    threat_score_breakdown: dict[str, Any] = {}
    is_coordinated_campaign: bool = False
    lookalikes: list[dict[str, Any]] = []
    technical_flags: dict[str, Any] = {}
    risk_increasers: list[dict[str, Any]] = []
    risk_reducers: list[dict[str, Any]] = []
    sender_classification: str = "UNKNOWN"


class EvidenceCustodyBase(BaseModel):
    sha256_hash: str

class UCOCaseResponse(BaseModel):
    id: int
    case_number: str
    status: str
    created_at: datetime
    trace: TraceBase
    property: PropertyBase
    assertion: AssertionBase
    graph: dict[str, Any] = {}
    evidence_custody: EvidenceCustodyBase

    class Config:
        from_attributes = True
