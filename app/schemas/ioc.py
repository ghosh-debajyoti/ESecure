from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class IOCType(str, Enum):
    ip = "IP"
    domain = "Domain"
    hash = "Hash"
    url = "URL"
    email = "Email"


class IOCSeverity(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class IOCBase(BaseModel):
    type: IOCType
    value: str
    severity: IOCSeverity
    description: Optional[str] = None
    campaign_id: int


class IOCCreate(IOCBase):
    pass


class IOCResponse(IOCBase):
    id: int
    timestamp: datetime
    type: str
    severity: str

    class Config:
        from_attributes = True
