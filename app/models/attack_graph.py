from sqlalchemy import Column, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class AttackGraph(Base):
    __tablename__ = "attack_graphs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), unique=True, index=True)
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list)

    # Optional: establish relationship back to campaign if needed later
    # campaign = relationship("Campaign", back_populates="attack_graph")
