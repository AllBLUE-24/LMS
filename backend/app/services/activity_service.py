import asyncio
from fastapi import Depends
from ..repository.activity_repository import ActivityRepository
from ..repository.lead_repository import LeadRepository
from ..repository.user_repository import UserRepository
from ..schemas.activity import Activity
from .notification_service import NotificationService
from ..schemas.notification import NotificationCreate
from typing import List, Dict, Any
import re

class ActivityService:
    def __init__(self, 
                 activity_repository: ActivityRepository = Depends(),
                 user_repository: UserRepository = Depends(),
                 lead_repository: LeadRepository = Depends(),
                 notification_service: NotificationService = Depends()):
        self.repository = activity_repository
        self.user_repository = user_repository
        self.lead_repository = lead_repository
        self.notification_service = notification_service

    async def get_activities_for_lead(self, tenant_id: str, lead_id: str) -> List[Activity]:
        """Gets all activities for a lead within a specific tenant."""
        return await self.repository.get_by_lead_id(tenant_id, lead_id)

    

    async def create_activity(self, tenant_id: str, lead_id: str, user_id: str, activity_type: str, data: Dict[str, Any]) -> Activity:
        """Creates a new activity for a lead within a specific tenant."""
        mentions = []
        author_name = "A user"

        # --- Fetch Author's Name ---
        author = await self.user_repository.get_by_id(tenant_id, user_id)
        if author:
            author_name = author['name']
        
        if activity_type == 'note':
            content = data.get('content', '')
            mentions = re.findall(r'@\[.*?\]\((.*?)\)', content)
            data['author'] = author_name

        activity = Activity(
            lead_id=lead_id,
            user_id=user_id,
            activity_type=activity_type,
            data=data,
            mentions=mentions
        )
        new_activity = await self.repository.add(tenant_id, activity)

        if mentions:
            # Run the async notification function in the background
            asyncio.create_task(self._send_mention_notifications(tenant_id, lead_id, user_id, mentions))

        return new_activity

    def add_to_batch(self, tenant_id: str, batch, lead_id: str, user_id: str, activity_type: str, data: Dict[str, Any]):
        """
        Adds a new activity to a Firestore batch for a specific tenant.
        """
        activity = Activity(
            lead_id=lead_id,
            user_id=user_id,
            activity_type=activity_type,
            data=data,
            mentions=[]  # Mentions are not processed in batch operations for now
        )
        self.repository.add_to_batch(tenant_id, batch, activity)

    async def _send_mention_notifications(self, tenant_id: str, lead_id: str, from_user_id: str, mentioned_user_ids: List[str]):
        """Sends notifications to mentioned users."""
        from_user = await self.user_repository.get_by_id(tenant_id, from_user_id)
        from_user_name = from_user['name'] if from_user else "A colleague"

        lead_doc = await self.lead_repository.get_by_id(tenant_id, lead_id)
        lead_name = lead_doc.to_dict().get('name') if lead_doc.exists else "a lead"

        for user_id in mentioned_user_ids:
            if user_id == from_user_id:
                continue
            
            notification_data = NotificationCreate(
                user_id=user_id,
                message=f"{from_user_name} mentioned you in a note on lead '{lead_name}'.",
                link=f"/leads/{lead_id}"
            )
            await self.notification_service.create_notification(tenant_id, notification_data)
