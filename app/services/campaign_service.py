import traceback

try:
    import tlsh
except ImportError:
    tlsh = None

from sqlalchemy.orm import Session
from app.models import EmailAnalysis

def detect_and_store_campaign(email_data: dict, new_tlsh_hash: str, db_session: Session) -> dict:
    """
    Detects if the current email is part of a coordinated campaign using TLSH fuzzy hashing
    and stores the new email analysis in the PostgreSQL database.
    """
    result = {
        "is_coordinated_campaign": False,
        "lookalikes": []
    }
    
    if not db_session:
        return result
        
    try:
        # Save current email to DB first
        new_analysis = EmailAnalysis(
            case_number=email_data.get("case_number"),
            subject=email_data.get("subject"),
            sender=email_data.get("sender"),
            tlsh_hash=new_tlsh_hash,
            threat_score=email_data.get("threat_score")
        )
        db_session.add(new_analysis)
        db_session.commit()
        db_session.refresh(new_analysis)
    except Exception as e:
        print(f"Failed to store email analysis in PostgreSQL: {e}")
        traceback.print_exc()
        if db_session:
            db_session.rollback()

    if not new_tlsh_hash or tlsh is None:
        return result

    try:
        # Fetch all other records that have a tlsh_hash
        historical_records = db_session.query(EmailAnalysis).filter(
            EmailAnalysis.tlsh_hash.isnot(None),
            EmailAnalysis.id != new_analysis.id
        ).all()
        
        campaign_matches = []
        for record in historical_records:
            try:
                # Calculate TLSH difference score.
                # A score < 50 indicates high similarity.
                diff = tlsh.diff(new_tlsh_hash, record.tlsh_hash)
                if diff < 50:
                    campaign_matches.append(record.case_number)
            except Exception:
                continue
                
        if campaign_matches:
            result["is_coordinated_campaign"] = True
            result["lookalikes"] = list(set(campaign_matches))
            
    except Exception as e:
        print(f"Failed to detect campaign using PostgreSQL: {e}")
        traceback.print_exc()
        
    return result
