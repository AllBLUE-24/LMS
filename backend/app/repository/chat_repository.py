from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.base_query import FieldFilter
from app.schemas.chat_schema import ChatMessageCreate
from typing import List, Dict, Any
from datetime import datetime
from app.db.firestore import db

class ChatRepository:
    def __init__(self):
        self.db = db

    def _get_messages_ref(self, tenant_id: str):
        return self.db.collection(f'tenants/{tenant_id}/chat_messages')

    def _get_channels_ref(self, tenant_id: str):
        return self.db.collection(f'tenants/{tenant_id}/chat_channels')

    def get_messages_by_channel(self, tenant_id: str, channel_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetches messages for a specific channel within a specific tenant."""
        messages_ref = self._get_messages_ref(tenant_id)
        docs = messages_ref.where(filter=FieldFilter('channel_id', '==', channel_id)).order_by('timestamp', direction='DESCENDING').limit(limit).stream()
        messages = []
        for doc in docs:
            msg_data = doc.to_dict()
            msg_data['id'] = doc.id
            messages.append(msg_data)
        return messages

    def create_message(self, tenant_id: str, channel_id: str, user_id: str, username: str, message_data: ChatMessageCreate) -> Dict[str, Any]:
        """Creates a new chat message within a specific tenant."""
        messages_ref = self._get_messages_ref(tenant_id)
        doc_ref = messages_ref.document()
        new_message = {
            "channel_id": channel_id,
            "user_id": user_id,
            "username": username,
            "message": message_data.message,
            "timestamp": datetime.utcnow()
        }
        doc_ref.set(new_message)
        new_message['id'] = doc_ref.id
        return new_message

    def get_channel_by_name(self, tenant_id: str, name: str) -> Dict[str, Any] | None:
        """Gets a chat channel by name within a specific tenant."""
        channels_ref = self._get_channels_ref(tenant_id)
        docs = channels_ref.where(filter=FieldFilter('name', '==', name)).limit(1).stream()
        for doc in docs:
            channel_data = doc.to_dict()
            channel_data['id'] = doc.id
            return channel_data
        return None

    def create_channel(self, tenant_id: str, name: str) -> Dict[str, Any]:
        """Creates a new chat channel within a specific tenant."""
        channels_ref = self._get_channels_ref(tenant_id)
        doc_ref = channels_ref.document()
        new_channel = {"name": name}
        doc_ref.set(new_channel)
        new_channel['id'] = doc_ref.id
        return new_channel