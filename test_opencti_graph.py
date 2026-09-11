import asyncio
from app.core.database import SessionLocal, engine, Base
from app.models.campaign import Campaign
from app.models.ioc import IOC
from app.models.domain import Case, Indicator, EmailEvidence
from app.main import app
from fastapi.testclient import TestClient

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    # Clear existing
    db.query(Indicator).delete()
    db.query(EmailEvidence).delete()
    db.query(Case).delete()
    db.query(IOC).delete()
    db.query(Campaign).delete()
    
    # Create Campaign
    camp = Campaign(name="Test OpenCTI Campaign")
    db.add(camp)
    db.commit()
    
    # Create IOC
    ioc = IOC(campaign_id=camp.id, type="DOMAIN", value="evil-domain.com", severity="High")
    db.add(ioc)
    db.commit()

    # Create Case
    case = Case(case_number="CAS-OCTI-001", threat_score=99.0, status="open")
    db.add(case)
    db.commit()
    
    # Create Indicator with OpenCTI intel
    intel_data = {
        "opencti_intel": {
            "status": "success",
            "id": "observable--abc-123",
            "entity_type": "Domain-Name",
            "observable_value": "evil-domain.com",
            "x_opencti_description": "Malicious domain"
        }
    }
    ind = Indicator(case_id=case.id, type="DOMAIN", value="evil-domain.com", malicious_confidence=1.0, intel=intel_data)
    db.add(ind)
    db.commit()
    db.close()

seed_db()

client = TestClient(app)
response = client.get("/api/attack-graph/normalized")
data = response.json()

import json
print(json.dumps(data, indent=2))
