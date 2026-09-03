import re
import traceback
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.domain import Case, EmailEvidence
from app.schemas.domain import UCOCaseResponse
from app.services.dna_service import DnaService
from app.services.evidence_service import EvidenceService
from app.services.forensic_service import ForensicEngineService
from app.services.graph_service import GraphService
from app.services.intel_service import IntelService
from app.services.parser_service import EmailParserService
from app.services.threat_scoring_service import ThreatScoringService
from app.services.translator_service import TranslatorService
from app.services.threat_intel_service import ThreatIntelService
from app.database import get_db as get_pg_db
from app.services.campaign_service import detect_and_store_campaign
from app.services.report_service import ReportService
from app.services.relay_service import RelayService
from app.services.attachment_service import AttachmentService
from app.models import EmailAnalysis

router = APIRouter()

@router.post("/analyze", response_model=UCOCaseResponse)
async def analyze_email(file: UploadFile = File(...), db: Session = Depends(get_db), pg_db: Session = Depends(get_pg_db)):
    if not file.filename.endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are supported")
        
    try:
        raw_bytes = await file.read()
        
        # 1. Parse Email
        parser = EmailParserService(raw_bytes)
        parsed = parser.parse_all()
        
        # Override basic relay route with GeoIP enriched route
        parsed.relay_route = await RelayService.analyze_route(parser.msg)
        
        # Override simple attachments with forensic inspected attachments
        parsed.attachments = AttachmentService.inspect_attachments(parser.msg)
        
        # 2. Forensics & Threat Score
        alignment = ForensicEngineService(parsed.headers).evaluate_alignment()
        final_score = ThreatScoringService(parsed.body, alignment["technical_flag_score"]).generate_final_score()
        
        # 3. TLSH DNA
        tlsh_hash = DnaService.generate_hash(parsed.body)
        sim_score, is_coordinated = DnaService.correlate_tlsh(db, tlsh_hash)
        
        # Penalize for malicious attachments
        if any(a.get("is_suspicious", False) for a in parsed.attachments):
            final_score = min(final_score + 40.0, 100.0)
        
        # 4. Intelligence
        infra_intel = {}
        if parsed.relay_route and parsed.relay_route[0].get("ip"):
            infra_intel = IntelService.query_ip(parsed.relay_route[0]["ip"])
            
        from_dom = re.search(r'@([\w.-]+)', str(parsed.headers.get("From") or ""))
        reply_dom = re.search(r'@([\w.-]+)', str(parsed.headers.get("Reply-To") or ""))
        lookalikes = []
        if from_dom and reply_dom:
            res = IntelService.check_lookalike_domain(from_dom.group(1), reply_dom.group(1))
            if res.get("is_lookalike"):
                lookalikes.append(res)

        parsed.indicators = await ThreatIntelService.enrich_indicators(parsed.indicators)
        for ind in parsed.indicators:
            if ind.get("reputation", {}).get("is_flagged", False):
                final_score = max(final_score, 85.0)
                
        # 5. Graph
        graph = GraphService.generate_stix_graph(parsed.indicators, infra_intel, is_coordinated, parsed.relay_route, parsed.attachments)
        
        # 6. Database Records
        case_number = f"CAS-{uuid.uuid4().hex[:8].upper()}"
        db_case = Case(
            case_number=case_number,
            threat_score=final_score,
            status="open",
            infrastructure=infra_intel,
            relay_route=parsed.relay_route,
            stix_graph=graph
        )
        db.add(db_case)
        db.flush()
        
        # Call Campaign Service to use Postgres and TLSH
        email_data = {
            "case_number": case_number,
            "subject": str(parsed.headers.get("Subject", "")),
            "sender": str(parsed.headers.get("From", "")),
            "threat_score": final_score
        }
        campaign_info = detect_and_store_campaign(email_data, tlsh_hash, pg_db)
        
        if campaign_info.get("is_coordinated_campaign"):
            is_coordinated = True
            
        for c in campaign_info.get("lookalikes", []):
            lookalikes.append({"type": "CAMPAIGN_MATCH", "case_number": c})

        sha256_hash = EvidenceService.generate_hash(raw_bytes)
        def clean_header(val):
            if val is None: return None
            if isinstance(val, list): return str(val[0])
            return str(val)

        db_evidence = EmailEvidence(
            case_id=db_case.id,
            sender=clean_header(parsed.headers.get("From")),
            reply_to=clean_header(parsed.headers.get("Reply-To")),
            subject=clean_header(parsed.headers.get("Subject")),
            received_date=clean_header(parsed.headers.get("Date")),
            evidence_hash=sha256_hash,
            tlsh_hash=tlsh_hash
        )
        db.add(db_evidence)
        db.commit()
        db.refresh(db_case)
        
        # 7. Translator to UCO
        uco_format = TranslatorService.map_to_uco(
            headers=parsed.headers,
            relay_route=parsed.relay_route,
            indicators=parsed.indicators,
            attachments=parsed.attachments,
            mime_boundaries=parsed.mime_boundaries,
            tlsh_hash=tlsh_hash,
            threat_score=final_score,
            technical_flags=alignment,
            lookalikes=lookalikes,
            is_coordinated=is_coordinated,
            sha256_hash=sha256_hash
        )
        
        # Update postgres DB with uco_data for reports
        try:
            from app.models import EmailAnalysis
            pg_record = pg_db.query(EmailAnalysis).filter_by(case_number=case_number).first()
            if pg_record:
                pg_record.uco_data = {
                    "case_number": db_case.case_number,
                    "status": db_case.status,
                    "created_at": db_case.created_at.isoformat() if db_case.created_at else None,
                    **uco_format
                }
                pg_db.commit()
        except Exception as e:
            pg_db.rollback()
            print(f"Failed to save uco_data to Postgres: {e}")
            
        return {
            "id": db_case.id,
            "case_number": db_case.case_number,
            "status": db_case.status,
            "created_at": db_case.created_at,
            **uco_format,
            "graph": graph
        }

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during analysis: {e!s}")

@router.get("/export/{case_number}")
async def export_pdf_report(case_number: str, pg_db: Session = Depends(get_pg_db)):
    try:
        record = pg_db.query(EmailAnalysis).filter_by(case_number=case_number).first()
        if not record or not record.uco_data:
            raise HTTPException(status_code=404, detail="Case data not found")
            
        pdf_buffer = ReportService.generate_pdf(record.uco_data)
        
        headers = {
            'Content-Disposition': f'attachment; filename="forensic_report_{case_number}.pdf"'
        }
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers=headers
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {e!s}")
