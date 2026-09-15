from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from collections import defaultdict
import uuid
import logging

from app.database import get_db as get_pg_db
from app.models.email_analysis import EmailAnalysis

router = APIRouter()

@router.get("/risk")
async def get_employee_risk(pg_db: Session = Depends(get_pg_db)):
    try:
        # Business mode aggregates ONLY legitimate application-generated cases.
        # These are stored in EmailAnalysis. The ML training dataset is not in this table.
        records = pg_db.query(EmailAnalysis).filter(EmailAnalysis.is_training == False).all()
        
        targets: Dict[str, Dict[str, Any]] = {}
        
        for r in records:
            if not r.uco_data:
                continue
            
            trace = r.uco_data.get("trace", {})
            target_info = trace.get("target_info", {})
            assertion = r.uco_data.get("assertion", {})
            
            target_email = target_info.get("target_email", "unknown")
            target_type = target_info.get("target_type", "Unknown Target")
            department = target_info.get("likely_department", None)
            
            score = assertion.get("threat_score", 0.0)
            severity = assertion.get("severity", "LOW")
            fraud_type = assertion.get("fraud_type", "Other/Unclassified")
            
            if target_email not in targets:
                targets[target_email] = {
                    "target_email": target_email,
                    "target_type": target_type,
                    "likely_department": department,
                    "threat_count": 0,
                    "max_threat_score": 0.0,
                    "aggregate_risk": 0.0,
                    "fraud_types": defaultdict(int),
                    "critical_threats": 0
                }
            
            t = targets[target_email]
            t["threat_count"] += 1
            t["aggregate_risk"] += score
            if score > t["max_threat_score"]:
                t["max_threat_score"] = score
            
            if fraud_type and fraud_type != "Other/Unclassified":
                t["fraud_types"][fraud_type] += 1
                
            if severity in ["HIGH", "CRITICAL"]:
                t["critical_threats"] += 1

        result = []
        for v in targets.values():
            if v["threat_count"] > 0:
                most_common_fraud = "None"
                if v["fraud_types"]:
                    most_common_fraud = max(v["fraud_types"].items(), key=lambda x: x[1])[0]
                
                result.append({
                    "target": v["target_email"],
                    "target_type": v["target_type"],
                    "likely_department": v["likely_department"],
                    "threat_count": v["threat_count"],
                    "max_threat_score": v["max_threat_score"],
                    "aggregate_risk": v["aggregate_risk"],
                    "common_attack_type": most_common_fraud,
                    "critical_threats": v["critical_threats"]
                })
        
        # Sort by aggregate risk
        result.sort(key=lambda x: x["aggregate_risk"], reverse=True)
        return result
        
    except Exception as e:
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}] fetching business risk: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch risk data. Reference ID: {error_id}")


@router.get("/progression")
async def get_attack_progression(pg_db: Session = Depends(get_pg_db)):
    try:
        records = pg_db.query(EmailAnalysis).filter(EmailAnalysis.is_training == False).order_by(EmailAnalysis.created_at.asc()).all()
        
        # We will build progressions by checking for shared IOCs or Campaign or Sender
        # Progression node: { case_number, timestamp, target, threat_type, severity, shared_ioc, relationship, confidence }
        
        progressions = []
        
        for i, r in enumerate(records):
            if not r.uco_data:
                continue
            
            # Extract data
            case_num = r.case_number
            created_at = r.created_at
            trace = r.uco_data.get("trace", {})
            target_email = trace.get("target_info", {}).get("target_email", "unknown")
            assertion = r.uco_data.get("assertion", {})
            fraud_type = assertion.get("fraud_type", "Unknown")
            severity = assertion.get("severity", "LOW")
            score = assertion.get("threat_score", 0.0)
            
            # Find relationships with previous cases
            relationship = None
            evidence = None
            shared_ioc = None
            confidence = "Low"
            
            for prev_r in reversed(records[:i]):
                if not prev_r.uco_data:
                    continue
                
                # Check for shared sender
                if r.sender and prev_r.sender and r.sender == prev_r.sender:
                    relationship = "Shared Sender"
                    evidence = f"Sender {r.sender}"
                    confidence = "Medium"
                    break
                    
                # Check for shared IP in relay route
                prev_ips = [h.get("ip_address") for h in prev_r.uco_data.get("trace", {}).get("relay_route", []) if h.get("ip_address")]
                curr_ips = [h.get("ip_address") for h in trace.get("relay_route", []) if h.get("ip_address")]
                shared_ips = set(prev_ips) & set(curr_ips)
                if shared_ips:
                    relationship = "Shared Infrastructure"
                    evidence = f"IP: {list(shared_ips)[0]}"
                    confidence = "High"
                    break
                    
                # Check TLSH similarity
                if r.tlsh_hash and prev_r.tlsh_hash and r.tlsh_hash == prev_r.tlsh_hash:
                    relationship = "Content Similarity"
                    evidence = "Matching TLSH Hash"
                    confidence = "High"
                    break
            
            node = {
                "id": case_num,
                "timestamp": created_at.isoformat() if created_at else None,
                "target": target_email,
                "threat_type": fraud_type,
                "severity": severity,
                "threat_score": score,
                "relationship": relationship,
                "evidence": evidence,
                "confidence": confidence
            }
            
            if relationship:
                # Append to existing progression if evidence is strong enough
                # For simplicity, we just add it to a unified timeline with the relationship pointing to the past
                progressions.append(node)
            else:
                node["relationship"] = "Initial Target"
                node["evidence"] = "First Appearance"
                node["confidence"] = "High"
                progressions.append(node)
                
        return progressions
        
    except Exception as e:
        error_id = str(uuid.uuid4())
        logging.error(f"Internal Error [{error_id}] fetching attack progression: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch progression data. Reference ID: {error_id}")
