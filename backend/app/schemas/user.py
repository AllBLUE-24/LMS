from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True 

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    capabilities: List[str] = []

class User(UserBase):
    id: str # The document ID from Firestore
    capabilities: List[str] = []
    tenantId: Optional[str] = None

class UserUpdateCapabilities(BaseModel):
    capabilities: List[str]
