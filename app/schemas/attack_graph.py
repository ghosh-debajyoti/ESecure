from typing import List, Optional
from pydantic import BaseModel

class NodeSchema(BaseModel):
    id: str
    label: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class AttackGraphBase(BaseModel):
    nodes: List[NodeSchema] = []
    edges: List[EdgeSchema] = []

class AttackGraphCreate(AttackGraphBase):
    pass

class AttackGraphResponse(AttackGraphBase):
    id: int
    campaign_id: int

    class Config:
        from_attributes = True
