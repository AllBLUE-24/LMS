from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1.async_client import AsyncClient
from app.db.firestore import db
from ..schemas.notification import Notification

class NotificationRepository:
    def __init__(self):
        self.db: AsyncClient = db

    def _get_collection_ref(self, tenant_id: str):
        return self.db.collection(f'tenants/{tenant_id}/notifications')

    async def get_by_user_id(self, tenant_id: str, user_id: str):
        """Gets all notifications for a user, ordered by timestamp."""
        try:
            collection_ref = self._get_collection_ref(tenant_id)
            query = collection_ref.where(filter=FieldFilter('user_id', '==', user_id)).order_by('timestamp', direction='DESCENDING')
            docs = query.stream()
            notifications = []
            async for doc in docs:
                notification_data = doc.to_dict()
                notification_data['id'] = doc.id
                notifications.append(Notification(**notification_data))
            return notifications
        except Exception as e:
            print(f"Error fetching notifications for user {user_id}: {e}")
            return []

    async def mark_as_read(self, tenant_id: str, notification_id: str):
        """Marks a specific notification as read."""
        doc_ref = self._get_collection_ref(tenant_id).document(notification_id)
        await doc_ref.update({'is_read': True})

    async def add(self, tenant_id: str, notification_data: dict):
        """Adds a new notification."""
        collection_ref = self._get_collection_ref(tenant_id)
        doc_ref = collection_ref.document()
        await doc_ref.set(notification_data)
        return doc_ref.id
