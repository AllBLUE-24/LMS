from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    link: str | None = None
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: str

class Notification(NotificationBase):
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
