from fastapi import APIRouter, Depends
from typing import List
from app.schemas.notification import Notification, NotificationCreate
from app.services.notification_service import NotificationService
from app.api.v1.dependencies import get_current_user

router = APIRouter()

@router.post("", response_model=Notification)
async def create_notification(
    notification: NotificationCreate, 
    auth: dict = Depends(get_current_user),
    service: NotificationService = Depends()
):
    """Creates a notification within the current user's tenant."""
    return await service.create_notification(auth['tenant_id'], notification)

@router.get("", response_model=List[Notification]) 
async def get_notifications(
    auth: dict = Depends(get_current_user),
    service: NotificationService = Depends()
):
    """Retrieves notifications for the current user within their tenant."""
    return await service.get_notifications_by_user(auth['tenant_id'], auth['uid'])
    
@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str, 
    auth: dict = Depends(get_current_user),
    service: NotificationService = Depends()
):
    """Marks a notification as read within the current user's tenant."""
    await service.mark_as_read(auth['tenant_id'], notification_id)
    return {"message": "Notification marked as read"}
