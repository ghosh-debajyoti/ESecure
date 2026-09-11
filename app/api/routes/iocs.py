from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.ioc import IOC
from app.schemas.ioc import IOCCreate, IOCResponse

router = APIRouter()


@router.post("/", response_model=IOCResponse)
def add_ioc(ioc: IOCCreate, db: Session = Depends(get_db)):
    # Verify campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == ioc.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    db_ioc = IOC(
        type=ioc.type.value,
        value=ioc.value,
        severity=ioc.severity.value,
        description=ioc.description,
        campaign_id=ioc.campaign_id
    )
    db.add(db_ioc)
    db.commit()
    db.refresh(db_ioc)
    return db_ioc


@router.get("/campaign/{campaign_id}", response_model=List[IOCResponse])
def get_iocs_by_campaign(campaign_id: int, db: Session = Depends(get_db)):
    iocs = db.query(IOC).filter(IOC.campaign_id == campaign_id).all()
    return iocs


@router.delete("/{id}")
def delete_ioc(id: int, db: Session = Depends(get_db)):
    db_ioc = db.query(IOC).filter(IOC.id == id).first()
    if not db_ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
        
    db.delete(db_ioc)
    db.commit()
    return {"detail": "IOC deleted successfully"}

@router.get("/", response_model=List[IOCResponse])
def get_all_iocs(db: Session = Depends(get_db)):
    return db.query(IOC).all()
