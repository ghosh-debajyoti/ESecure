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
