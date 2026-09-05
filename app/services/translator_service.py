from typing import Any

from app.schemas.domain import (
    AssertionBase,
    EvidenceCustodyBase,
    PropertyBase,
    TraceBase,
)


class TranslatorService:
    @staticmethod
    def map_to_uco(headers: dict[str, Any], body: str, relay_route: list[dict[str, Any]], 
                   indicators: list[dict[str, Any]], attachments: list[dict[str, Any]], 
                   mime_boundaries: list[str], tlsh_hash: str, 
                   threat_score: float, threat_score_breakdown: dict[str, Any], technical_flags: dict[str, Any], 
                   lookalikes: list[dict[str, Any]], is_coordinated: bool, 
                   sha256_hash: str, severity: str = "LOW",
                   risk_increasers: list[dict[str, Any]] = None,
                   risk_reducers: list[dict[str, Any]] = None) -> dict[str, Any]:
                   
        trace = TraceBase(headers=headers, relay_route=relay_route, body=body)
        prop = PropertyBase(indicators=indicators, attachments=attachments, mime_boundaries=mime_boundaries, tlsh_hash=tlsh_hash)
        assertion = AssertionBase(
            threat_score=threat_score,
            severity=severity,
            threat_score_breakdown=threat_score_breakdown,
            is_coordinated_campaign=is_coordinated,
            lookalikes=lookalikes,
            technical_flags=technical_flags,
            risk_increasers=risk_increasers or [],
            risk_reducers=risk_reducers or []
        )
        evidence = EvidenceCustodyBase(sha256_hash=sha256_hash)
        
        return {
            "trace": trace.model_dump(),
            "property": prop.model_dump(),
            "assertion": assertion.model_dump(),
            "evidence_custody": evidence.model_dump()
        }

