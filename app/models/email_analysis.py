import datetime
import uuid

from sqlalchemy import Column, DateTime, Float, String, JSON

from app.database import Base


class EmailAnalysis(Base):
    __tablename__ = "email_analysis"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_number = Column(String, index=True)
    subject = Column(String, nullable=True)
    sender = Column(String, nullable=True)
    tlsh_hash = Column(String, nullable=True)
    threat_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    uco_data = Column(JSON, nullable=True)

