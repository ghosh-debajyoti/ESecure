from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.attack_graph import AttackGraph
from app.models.campaign import Campaign
from app.schemas.attack_graph import AttackGraphCreate, AttackGraphResponse

router = APIRouter()

@router.get("/campaign/{campaign_id}", response_model=AttackGraphResponse)
def get_graph_by_campaign(campaign_id: int, db: Session = Depends(get_db)):
    graph = db.query(AttackGraph).filter(AttackGraph.campaign_id == campaign_id).first()
    if not graph:
        raise HTTPException(status_code=404, detail="Attack Graph not found for this campaign")
    return graph

@router.put("/campaign/{campaign_id}", response_model=AttackGraphResponse)
def save_graph(campaign_id: int, graph_data: AttackGraphCreate, db: Session = Depends(get_db)):
    # Verify the campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    graph = db.query(AttackGraph).filter(AttackGraph.campaign_id == campaign_id).first()
    
    nodes_dict = [node.dict() for node in graph_data.nodes]
    edges_dict = [edge.dict() for edge in graph_data.edges]
    
    if graph:
        # Update existing
        graph.nodes = nodes_dict
        graph.edges = edges_dict
    else:
        # Create new
        graph = AttackGraph(
            campaign_id=campaign_id,
            nodes=nodes_dict,
            edges=edges_dict
        )
        db.add(graph)
        
    db.commit()
    db.refresh(graph)
    return graph

from typing import Optional
from app.models.domain import Case, Indicator, EmailEvidence
from app.models.ioc import IOC

@router.get("/normalized")
def get_normalized_graph(campaign_id: Optional[int] = None, db: Session = Depends(get_db)):
    nodes = []
    edges = []
    
    # 1. Fetch campaigns
    campaign_query = db.query(Campaign)
    if campaign_id:
        campaign_query = campaign_query.filter(Campaign.id == campaign_id)
    campaigns = campaign_query.all()
    
    camp_ids = [c.id for c in campaigns]
    
    for c in campaigns:
        nodes.append({
            "id": f"camp-{c.id}",
            "type": "campaign",
            "label": c.name or f"Campaign {c.id}",
            "metadata": {"created_at": c.created_at.isoformat() if c.created_at else None}
        })
        
    # 2. Fetch IOCs
    iocs = db.query(IOC).filter(IOC.campaign_id.in_(camp_ids)).all() if camp_ids else []
    ioc_values = set()
    for ioc in iocs:
        ioc_node_id = f"ioc-{ioc.id}"
        nodes.append({
            "id": ioc_node_id,
            "type": "ioc",
            "label": ioc.value,
            "value": ioc.value,
            "metadata": {
                "ioc_type": ioc.type,
                "severity": ioc.severity,
                "intel": ioc.intel
            }
        })
        edges.append({
            "id": f"e-camp-{ioc.campaign_id}-ioc-{ioc.id}",
            "source": f"camp-{ioc.campaign_id}",
            "target": ioc_node_id,
            "relationship": "has_ioc"
        })
        ioc_values.add(ioc.value)
        
    # 3. Find matching Indicators from Cases
    indicators = db.query(Indicator).filter(Indicator.value.in_(ioc_values)).all() if ioc_values else []
    case_ids = {ind.case_id for ind in indicators}
    
    # Add other indicators from these cases to show full context, not just the matching ones
    all_case_indicators = db.query(Indicator).filter(Indicator.case_id.in_(case_ids)).all() if case_ids else []
    
    for ind in all_case_indicators:
        ind_node_id = f"ind-{ind.id}"
        nodes.append({
            "id": ind_node_id,
            "type": "indicator",
            "label": ind.value,
            "value": ind.value,
            "metadata": {
                "ind_type": ind.type,
                "malicious_confidence": ind.malicious_confidence,
                "intel": ind.intel
            }
        })
        edges.append({
            "id": f"e-case-{ind.case_id}-ind-{ind.id}",
            "source": f"case-{ind.case_id}",
            "target": ind_node_id,
            "relationship": "extracted"
        })
        
        # Link Indicator to IOC if values match
        matching_iocs = [ioc for ioc in iocs if ioc.value == ind.value]
        for mioc in matching_iocs:
            edges.append({
                "id": f"e-ind-{ind.id}-ioc-{mioc.id}",
                "source": ind_node_id,
                "target": f"ioc-{mioc.id}",
                "relationship": "matches"
            })
            
    # 4. Fetch Cases
    cases = db.query(Case).filter(Case.id.in_(case_ids)).all() if case_ids else []
    for case in cases:
        case_node_id = f"case-{case.id}"
        nodes.append({
            "id": case_node_id,
            "type": "case",
            "label": case.case_number,
            "value": case.case_number,
            "metadata": {
                "threat_score": case.threat_score,
                "status": case.status
            }
        })
        
    # 5. Fetch Evidence
    evidences = db.query(EmailEvidence).filter(EmailEvidence.case_id.in_(case_ids)).all() if case_ids else []
    for ev in evidences:
        ev_node_id = f"ev-{ev.id}"
        nodes.append({
            "id": ev_node_id,
            "type": "evidence",
            "label": ev.subject or "Email Evidence",
            "metadata": {
                "sender": ev.sender,
                "evidence_hash": ev.evidence_hash,
                "tlsh_hash": ev.tlsh_hash
            }
        })
        edges.append({
            "id": f"e-case-{ev.case_id}-ev-{ev.id}",
            "source": f"case-{ev.case_id}",
            "target": ev_node_id,
            "relationship": "has_evidence"
        })
        
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "node_count": len(nodes),
            "edge_count": len(edges)
        }
    }
