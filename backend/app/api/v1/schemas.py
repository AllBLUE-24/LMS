from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ======================================================================================
# Pydantic Models (Data Schemas)
# ======================================================================================
# These models define the expected data structure for API requests and responses.
# FastAPI uses them to validate incoming data, serialize outgoing data, and generate documentation.

class LeadBase(BaseModel):
    """Base model for lead fields."""
    name: str = Field(..., description="Full name of the lead.")
    email: str = Field(..., description="Email address of the lead.")
    status: Optional[str] = 'New'
    source: Optional[str] = None
    performanceMetric: Optional[float] = None
    location: Optional[str] = None
    contact: Optional[str] = None
    assignedAgent: Optional[str] = None
    nurturerId: Optional[str] = None
    assignedAt: Optional[datetime] = None
    lastUpdated: Optional[datetime] = None

class Lead(LeadBase):
    """Model for a lead retrieved from the database, including its ID."""
    id: str = Field(..., description="The unique ID of the lead document.")

class LeadImportInternal(BaseModel):
    """Internal model used for validating records from an uploaded file."""
    name: str
    email: str
    status: Optional[str] = 'New'
    source: Optional[str] = None
    #performanceMetric: Optional[float] = None
    location: Optional[str] = None
    contact: Optional[str] = None

class LeadAssignmentUpdate(BaseModel):
    """Schema for the request body when assigning a lead."""
    agentId: str = Field(..., description="The UID of the closing agent to assign the lead to.")

class BulkLeadAssignmentUpdate(BaseModel):
    """Schema for the request body when assigning multiple leads."""
    leadIds: List[str] = Field(..., description="A list of lead IDs to be assigned.")
    agentId: str = Field(..., description="The UID of the agent to assign the leads to.")

class LeadStatusUpdate(BaseModel):
    """Schema for the request body when updating a lead's status."""
    status: str
