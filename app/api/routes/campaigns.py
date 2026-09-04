from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignUpdateDNA, CampaignResponse

router = APIRouter()

@router.patch("/{id}/dna", response_model=CampaignResponse)
def update_campaign_dna(id: int, campaign_update: CampaignUpdateDNA, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.dna = campaign_update.dna.dict()
    
    db.commit()
    db.refresh(campaign)
    
    return campaign

# Optionally, add a GET route to create / retrieve for testing if none exist
@router.get("/{id}", response_model=CampaignResponse)
def get_campaign(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/", response_model=CampaignResponse)
def create_campaign(name: str, db: Session = Depends(get_db)):
    campaign = Campaign(name=name)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign
