from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class Activity(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    lead_id: str
    user_id: str
    activity_type: str  # e.g., 'note', 'status_change', 'assignment'
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any]  # For storing details like the note content, old/new status, etc.
    mentions: List[str] = []

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True

class ActivityCreate(BaseModel):
    lead_id: str
    activity_type: str
    data: Dict[str, Any]