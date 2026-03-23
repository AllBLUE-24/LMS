from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class Message(BaseModel):
    id: Optional[str] = None
    sender_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_url: Optional[str] = None
    file_type: Optional[str] = None

class Conversation(BaseModel):
    id: Optional[str] = None
    participants: List[str] # List of user IDs
    is_team_chat: bool = False
    team_id: Optional[str] = None
    last_message: Optional[Message] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    participants: List[str]
