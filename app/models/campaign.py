import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Campaign DNA object
    # Expected structure:
    # {
    #   "targetAudience": {"demographics": "...", "psychographics": "..."},
    #   "coreMessage": "...",
    #   "tone": ["...", "..."],
    #   "primaryGoal": "...",
    #   "brandGuidelines": {"primaryColor": "...", "slogan": "..."}
    # }
    dna = Column(JSON, nullable=True)
