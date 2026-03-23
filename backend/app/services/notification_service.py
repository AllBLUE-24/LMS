from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.base_query import FieldFilter
from fastapi import Depends
from app.api.v1.dependencies import get_db
from app.schemas.notification import NotificationCreate
from datetime import datetime

class NotificationService:
    def __init__(self, db: AsyncClient = Depends(get_db)):
        """
        Initializes the service with a database client dependency.
        """
        self.db = db

    def _get_collection_ref(self, tenant_id: str):
        """
        Returns a reference to the 'notifications' subcollection for a specific tenant.
        """
        return self.db.collection(f'tenants/{tenant_id}/notifications')

    async def create_notification(self, tenant_id: str, notification_data: NotificationCreate) -> dict:
        """
        Creates a single notification directly in Firestore for a specific tenant and returns it.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        notification = notification_data.model_dump()
        notification["link"] = notification_data.link
        notification["timestamp"] = datetime.utcnow()
        notification["is_read"] = False

        new_notification_ref = collection_ref.document()
        await new_notification_ref.set(notification)

        notification['id'] = new_notification_ref.id
        return notification

    async def get_notifications_by_user(self, tenant_id: str, user_id: str, last_notification_id: str = None, page_size: int = 15) -> list:
        """Fetches a paginated list of notifications for a user within a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        notifications_query = collection_ref.where(
            filter=FieldFilter("user_id", "==", user_id)
        ).order_by("timestamp", direction="DESCENDING")

        if last_notification_id:
            last_doc = await collection_ref.document(last_notification_id).get()
            if last_doc.exists:
                notifications_query = notifications_query.start_after(last_doc)

        notifications_query = notifications_query.limit(page_size)
        notifications = notifications_query.stream()

        notification_list = [{**notification.to_dict(), "id": notification.id} async for notification in notifications]

        print(f"DEBUG: Found {len(notification_list)} notifications for user {user_id} in tenant {tenant_id}.")

        return notification_list
    
    async def mark_as_read(self, tenant_id: str, notification_id: str):
        """
        Marks a single notification as read for a specific tenant.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        await collection_ref.document(notification_id).update({"is_read": True})
