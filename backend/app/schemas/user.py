# FILE: app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    capabilities: List[str] = []

class User(UserBase):
    id: str
    capabilities: List[str] = []
    organizationId: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdateCapabilities(BaseModel):
    capabilities: List[str]