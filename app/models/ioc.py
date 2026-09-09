import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class IOC(Base):
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True) # IP, Domain, Hash, URL, Email
    value = Column(String, index=True)
    severity = Column(String) # Low, Medium, High, Critical
    description = Column(String, nullable=True)
    intel = Column(JSON, nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Optional: establish relationship back to campaign if needed later
    # campaign = relationship("Campaign", back_populates="iocs")
