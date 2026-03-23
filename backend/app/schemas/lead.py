# app/schemas/lead.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# --- Enums for Nurturing Fields ---

class CourseInterestedEnum(str, Enum):
    a = "a"
    b = "b"
    c = "c"
    d = "d"
    e = "e"
    f = "f"
    g = "g"
    h = "h"
    i = "i"
    j = "j"
    k = "k"
    l = "l"

# --- Base Schemas ---

class LeadBase(BaseModel):
    """Base schema for lead data, containing common fields."""
    name: str = Field(..., example="Aarav Sharma")
    email: EmailStr = Field(..., example="aarav.sharma@example.com")    
    status: Optional[str] = Field("New", example="New")
    source: Optional[str] = Field(None, example="Website")
    performanceMetric: Optional[float] = Field(None, example=88.5)
    location: Optional[str] = Field(None, example="Pune")
    contact: Optional[str] = Field(None, example="9876543210")

    assignedNurturer: Optional[str] = Field(None, description="The ID of the assigned NURTURING agent.")
    assignedAgent: Optional[str] = Field(None, description="The ID of the assigned CLOSING agent.")

    # --- New Nurturing Fields ---
    next_call_date: Optional[datetime] = Field(None, description="The scheduled date for the next follow-up call.")
    interestedProduct: Optional[CourseInterestedEnum] = Field(None, description="The course the lead is interested in.")
    temperature: Optional[str] = Field(None, example="Hot")
    value: Optional[float] = Field(None, example=50000.0)
    timeline: Optional[str] = Field(None, example="1-3 Months")
    dealStage: Optional[str] = Field(None, example="Qualification")
    next_meet_date: Optional[datetime] = Field(None, description="The scheduled date for the next meeting.")

    # --- New Closing Fields ---
    fees_paid: Optional[float] = Field(None, example=45000.0)
    work_duration: Optional[str] = Field(None, example="6 Months")
    product_bought: Optional[str] = Field(None, description="The final product the lead purchased.")
    closing_notes: Optional[str] = Field(None, description="Final notes from the closer.")
    closing_date: Optional[datetime] = Field(None, description="The date the lead was closed.")

class LeadCloseDetailsUpdate(BaseModel):
    """Schema for a closer to close a lead."""
    fees_paid: float
    work_duration: str
    product_bought: str
    closing_notes: Optional[str] = None

class LeadQualificationUpdate(BaseModel):
    """Schema for a nurturer to qualify a lead."""
    interestedProduct: CourseInterestedEnum
    temperature: str
    value: float
    timeline: str
    dealStage: str
    notes: Optional[str] = None

class LeadImportInternal(LeadBase):
    """Schema for incoming lead data, used for manual entry and file uploads."""
    notes: Optional[str] = Field(None, example="Initial contact made, seems interested.")
    assignedAgent: Optional[str] = Field(None, description="The ID of the assigned CLOSING agent.")
    pass

class Lead(LeadBase):
    """Schema for a lead as it exists in our database, including the document ID."""
    id: str = Field(..., example="firestore_document_id")
    lastUpdated: Optional[datetime] = None
    assignedAt: Optional[datetime] = None
    generatorId: Optional[str] = Field(None, example="generator_user_id")
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeadAssignmentUpdate(BaseModel):
    """Schema for assigning a lead to an agent."""
    agentId: str = Field(..., example="agent_user_id")

class BulkLeadAssignmentUpdate(BaseModel):
    """Schema for assigning multiple leads to an agent."""
    leadIds: List[str] = Field(..., example=["lead_id_1", "lead_id_2"])
    agentId: str = Field(..., example="agent_user_id")

class LeadStatusUpdate(BaseModel):
    """Schema for updating a lead's status."""
    status: str = Field(..., example="Contacted")

class ScheduleMeetingRequest(BaseModel):
    """Schema for scheduling a meeting with a lead."""
    meetingTime: datetime = Field(..., example="2025-07-15T14:30:00")
    location: str = Field(..., example="Virtual - Google Meet")
    notes: Optional[str] = None

class ScheduleFollowUpRequest(BaseModel):
    """Schema for scheduling a follow-up call."""
    next_call_date: datetime
    reason: str
    note: Optional[str] = None

