from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class TargetAudience(BaseModel):
    demographics: Optional[str] = None
    psychographics: Optional[str] = None


class BrandGuidelines(BaseModel):
    primaryColor: Optional[str] = None
    slogan: Optional[str] = None


class CampaignDNA(BaseModel):
    targetAudience: Optional[TargetAudience] = None
    coreMessage: Optional[str] = None
    tone: Optional[List[str]] = []
    primaryGoal: Optional[str] = None
    brandGuidelines: Optional[BrandGuidelines] = None


class CampaignUpdateDNA(BaseModel):
    dna: CampaignDNA


class CampaignResponse(BaseModel):
    id: int
    name: Optional[str] = None
    created_at: datetime
    dna: Optional[CampaignDNA] = None

    class Config:
        from_attributes = True
