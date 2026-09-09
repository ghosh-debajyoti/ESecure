import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app
from app.core.database import Base, get_db
from app.models.campaign import Campaign
from app.models.ioc import IOC
from app.models.domain import Case, Indicator, EmailEvidence

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_normalized_graph():
    # 1. Setup mock data
    db = TestingSessionLocal()
    
    # Create Campaign
    camp = Campaign(name="Test Campaign")
    db.add(camp)
    db.commit()
    
    # Create IOC for Campaign
    ioc = IOC(campaign_id=camp.id, type="URL", value="http://malicious.com/login", severity="High", intel={"threatfox": {"status": "success", "threat_type": "phishing"}})
    db.add(ioc)
    db.commit()
    
    # Create Case
    case = Case(case_number="CAS-TEST-123", threat_score=85.0, status="open")
    db.add(case)
    db.commit()
    
    # Create Indicator matching the IOC
    ind = Indicator(case_id=case.id, type="URL", value="http://malicious.com/login", malicious_confidence=1.0, intel={"urlhaus": {"status": "success"}})
    db.add(ind)
    
    # Create Evidence
    ev = EmailEvidence(case_id=case.id, sender="attacker@evil.com", subject="Urgent Login", evidence_hash="abc", tlsh_hash="def")
    db.add(ev)
    
    db.commit()
    db.close()

    # 2. Call endpoint
    response = client.get("/api/attack-graph/normalized")
    assert response.status_code == 200
    data = response.json()
    
    # 3. Assert graph structure
    assert "nodes" in data
    assert "edges" in data
    
    nodes = data["nodes"]
    edges = data["edges"]
    
    # Check nodes
    types = [n["type"] for n in nodes]
    assert "campaign" in types
    assert "ioc" in types
    assert "case" in types
    assert "indicator" in types
    assert "evidence" in types
    
    # Check edges
    relationships = [e["relationship"] for e in edges]
    assert "has_ioc" in relationships
    assert "extracted" in relationships
    assert "has_evidence" in relationships
    assert "matches" in relationships
    
    # Verify metadata contains intel
    ioc_node = next(n for n in nodes if n["type"] == "ioc")
    assert ioc_node["metadata"]["intel"]["threatfox"]["status"] == "success"
    
    ind_node = next(n for n in nodes if n["type"] == "indicator")
    assert ind_node["metadata"]["intel"]["urlhaus"]["status"] == "success"
