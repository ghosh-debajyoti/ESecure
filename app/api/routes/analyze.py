import re
import traceback
import uuid
import logging
import asyncio
from app.core.exceptions import EmailParsingError

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.domain import Case, EmailEvidence, Indicator
from app.schemas.domain import UCOCaseResponse
from app.services.dna_service import DnaService
from app.services.evidence_service import EvidenceService
from app.services.forensic_service import ForensicEngineService
from app.services.graph_service import GraphService
from app.services.intel_service import IntelService
from app.services.parser_service import EmailParserService
from app.services.threat_scoring_service import ThreatScoringService, get_severity_label
from app.services.translator_service import TranslatorService
from app.services.threat_intel_service import ThreatIntelService
from app.services.threatfox_service import ThreatFoxService
from app.services.urlhaus_service import UrlhausService
from app.database import get_db as get_pg_db
from app.services.campaign_service import detect_and_store_campaign
from app.services.report_service import ReportService
from app.services.relay_service import RelayService
from app.services.attachment_service import AttachmentService
from app.services.thread_service import ThreadContinuityService
from app.services.image_service import ImageAnalysisService
from app.services.spoofed_service import SpoofedAccountService
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
        
        # 2. Forensics & Alignment
        alignment = ForensicEngineService(parsed.headers).evaluate_alignment()
        risk_increasers = list(alignment.get("risk_increasers", []))
        risk_reducers = list(alignment.get("risk_reducers", []))
        
        # QR/Image Phishing Detection
        image_results = await ImageAnalysisService.extract_and_analyze_images(parser.msg)
        image_penalty = 0.0
        for img_res in image_results:
            if img_res.is_suspicious:
                image_penalty += img_res.risk_score
                risk_increasers.append({
                    "factor": f"Malicious QR/Image Content found in {img_res.filename}",
                    "score": img_res.risk_score,
                    "category": "Payload"
                })
        
        # Thread Continuity Forensics
        thread_result = ThreadContinuityService.analyze_thread(parsed.headers, parsed.body)
        for finding in thread_result.findings:
            if finding.severity in ["HIGH", "MEDIUM"]:
                risk_increasers.append({
                    "factor": finding.description,
                    "score": 15 if finding.severity == "MEDIUM" else 25,
                    "category": "Identity"
                })
            else:
                risk_reducers.append({
                    "factor": finding.description,
                    "score": -5,
                    "category": "Identity"
                })
        
        # 3. TLSH DNA
        tlsh_hash = DnaService.generate_hash(parsed.body)
        sim_score, is_coordinated = DnaService.correlate_tlsh(db, tlsh_hash)
        
        # Penalize for malicious attachments
        attachment_penalty = 0.0
        if any(a.get("is_suspicious", False) for a in parsed.attachments):
            attachment_penalty = 40.0
            risk_increasers.append({
                "factor": "Malicious attachment payload identified",
                "score": 40,
                "category": "Payload"
            })
        else:
            if parsed.attachments:
                risk_reducers.append({
                    "factor": "Attachments scanned cleanly without execution risks",
                    "score": -5,
                    "category": "Payload"
                })

        # 4. Intelligence
        infra_intel = {}
        if parsed.relay_route and parsed.relay_route[0].get("ip"):
            infra_intel = IntelService.query_ip(parsed.relay_route[0]["ip"])
        elif parsed.relay_route and parsed.relay_route[0].get("ip_address"):
            first_hop = parsed.relay_route[0]
            infra_intel = {
                key: first_hop[key]
                for key in ("ip_address", "asn", "isp", "country", "region")
                if first_hop.get(key)
            }
            if infra_intel.get("ip_address"):
                infra_intel["ip"] = infra_intel.pop("ip_address")
            
        from_dom = re.search(r'@([\w.-]+)', str(parsed.headers.get("From") or ""))
        reply_dom = re.search(r'@([\w.-]+)', str(parsed.headers.get("Reply-To") or ""))
        lookalikes = []
        if from_dom and reply_dom:
            res = IntelService.check_lookalike_domain(from_dom.group(1), reply_dom.group(1))
            if res.get("is_lookalike"):
                lookalikes.append(res)
                risk_increasers.append({
                    "factor": f"Lookalike domain detected ({from_dom.group(1)} vs {reply_dom.group(1)})",
                    "score": 15,
                    "category": "Identity"
                })

        parsed.indicators = await ThreatIntelService.enrich_indicators(parsed.indicators)
        await asyncio.gather(
            ThreatFoxService.enrich_iocs(parsed.indicators, parsed.attachments),
            UrlhausService.enrich_urls(parsed.indicators),
            return_exceptions=True
        )
        
        intel_penalty = 0.0
        has_flagged_indicator = False
        for ind in parsed.indicators:
            if ind.get("reputation", {}).get("is_flagged", False):
                has_flagged_indicator = True
                intel_penalty = 35.0
                risk_increasers.append({
                    "factor": f"Flagged malicious indicator ({ind.get('type')}: {ind.get('value')})",
                    "score": 35,
                    "category": "Intelligence"
                })

        if not has_flagged_indicator and parsed.indicators:
            risk_reducers.append({
                "factor": "Extracted network indicators returned clean threat intelligence status",
                "score": -5,
                "category": "Intelligence"
            })

        # Spoofed vs Compromised Classification
        has_severe_threat = image_penalty > 0 or attachment_penalty > 0 or has_flagged_indicator
        sender_classification = SpoofedAccountService.classify_account(
            alignment=alignment,
            lookalikes=lookalikes,
            is_coordinated_campaign=is_coordinated,
            has_severe_threat=has_severe_threat
        )

        if sender_classification == "POSSIBLY_COMPROMISED":
            risk_increasers.append({
                "factor": "Account is POSSIBLY COMPROMISED (trusted infrastructure sending severe threats)",
                "score": 20,
                "category": "Identity"
            })

        # Calculate final threat score & severity label
        scoring_svc = ThreatScoringService(parsed.body, alignment["technical_flag_score"])
        final_score, phishing_model_score, ai_model_score, tech_score, ai_reasoning = scoring_svc.generate_final_score(risk_increasers, risk_reducers)
        severity = get_severity_label(final_score)

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
            risk_increasers.append({
                "factor": "Correlated structural similarity match with historical campaign cluster",
                "score": 15,
                "category": "Campaign"
            })
            
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
        
        # Save Indicators with their intel
        for ind in parsed.indicators:
            # Safely serialize intel blocks if they exist
            threatfox_intel = ind.get("threatfox_intel")
            urlhaus_intel = ind.get("urlhaus_intel")
            combined_intel = {}
            if threatfox_intel: combined_intel["threatfox"] = threatfox_intel
            if urlhaus_intel: combined_intel["urlhaus"] = urlhaus_intel
            
            db_indicator = Indicator(
                case_id=db_case.id,
                type=ind.get("type", "UNKNOWN"),
                value=ind.get("value", ""),
                malicious_confidence=1.0 if ind.get("reputation", {}).get("is_flagged", False) else 0.0,
                intel=combined_intel if combined_intel else None
            )
            db.add(db_indicator)

        db.commit()
        db.refresh(db_case)
        
        # 7. Translator to UCO
        uco_format = TranslatorService.map_to_uco(
            headers=parsed.headers,
            body=parsed.body,
            relay_route=parsed.relay_route,
            indicators=parsed.indicators,
            attachments=parsed.attachments,
            mime_boundaries=parsed.mime_boundaries,
            tlsh_hash=tlsh_hash,
            threat_score=final_score,
            severity=severity,
            threat_score_breakdown={
                "model_score": phishing_model_score,
                "ai_model_score": ai_model_score,
                "ai_reasoning": ai_reasoning,
                "technical_score": tech_score,
            },
            technical_flags=alignment,
            lookalikes=lookalikes,
            is_coordinated=is_coordinated,
            sha256_hash=sha256_hash,
            risk_increasers=risk_increasers,
            risk_reducers=risk_reducers,
            sender_classification=sender_classification
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
                    "graph": graph,
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

    except EmailParsingError as e:
        db.rollback()
        logging.warning(f"Failed to parse email file: {e}")
        raise HTTPException(status_code=422, detail="The provided email file is malformed or invalid.")
    except Exception as e:
        db.rollback()
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred during analysis. Reference ID: {error_id}")

@router.get("/export/{case_number}")
async def export_pdf_report(
    case_number: str, 
    explanation_mode: str = "technical", 
    privacy_mode: bool = False, 
    pg_db: Session = Depends(get_pg_db)
):
    try:
        record = pg_db.query(EmailAnalysis).filter_by(case_number=case_number).first()
        if not record or not record.uco_data:
            raise HTTPException(status_code=404, detail="Case data not found")
            
        pdf_buffer = ReportService.generate_pdf(
            record.uco_data, 
            explanation_mode=explanation_mode, 
            privacy_mode=privacy_mode
        )
        
        headers = {
            'Content-Disposition': f'attachment; filename="AAROHAN_Forensic_Report_{case_number}.pdf"'
        }
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers=headers
        )
    except HTTPException:
        raise
    except Exception as e:
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}] during PDF export: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate report. Reference ID: {error_id}")


@router.get("/cases")
async def get_cases(limit: int = 50, pg_db: Session = Depends(get_pg_db)):
    try:
        records = pg_db.query(EmailAnalysis).order_by(EmailAnalysis.created_at.desc()).limit(limit).all()
        return [{
            "case_number": r.case_number,
            "subject": r.subject,
            "sender": r.sender,
            "threat_score": r.threat_score,
            "created_at": r.created_at,
            "status": r.uco_data.get("status", "open") if r.uco_data else "open"
        } for r in records]
    except Exception as e:
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}] fetching cases: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch cases. Reference ID: {error_id}")

@router.get("/cases/{case_number}")
async def get_case(case_number: str, db: Session = Depends(get_db), pg_db: Session = Depends(get_pg_db)):
    try:
        record = pg_db.query(EmailAnalysis).filter_by(case_number=case_number).first()
        if not record or not record.uco_data:
            raise HTTPException(status_code=404, detail="Case data not found")
            
        data = dict(record.uco_data)
        if "graph" not in data:
            db_case = db.query(Case).filter_by(case_number=case_number).first()
            if db_case and db_case.stix_graph:
                data["graph"] = db_case.stix_graph
                
        return data
    except HTTPException:
        raise
    except Exception as e:
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}] fetching case {case_number}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch case. Reference ID: {error_id}")
