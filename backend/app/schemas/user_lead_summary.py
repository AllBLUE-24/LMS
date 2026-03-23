# backend/app/schemas/user_lead_summary.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LeadSummary(BaseModel):
    id: str
    name: str
    status: str
    next_call_date: Optional[datetime] = None

class UserLeadSummary(BaseModel):
    user_id: str = Field(..., alias="id")
    leads: List[LeadSummary] = []

    class Config:
        validate_by_name = True
        from_attributes = True
