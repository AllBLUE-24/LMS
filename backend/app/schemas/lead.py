# app/schemas/lead.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LeadInput(BaseModel):
    """
    Schema for incoming lead data.
    Name and email are required. All other fields are optional to allow
    for flexible imports.
    """
    name: str = Field(..., example="Aarav Sharma")
    email: EmailStr = Field(..., example="aarav.sharma@example.com")
    
    # --- The Fix: These fields are now Optional ---
    status: Optional[str] = Field("New", example="New")
    source: Optional[str] = Field(None, example="Website")
    performanceMetric: Optional[float] = Field(None, example=88.5)
    assignedAgent: Optional[str] = Field(None, example="Alex Ray")
    location: Optional[str] = Field(None, example="Pune")
    contact: Optional[str] = Field(None, example="9876543210")


    class Config:
        from_attributes = True

class Lead(LeadInput):
    """
    Schema for a lead as it exists in our database.
    Includes the document ID from Firestore.
    """
    id: str = Field(..., example="firestore_document_id")

