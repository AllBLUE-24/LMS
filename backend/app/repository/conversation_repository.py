from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.base_query import FieldFilter
from app.schemas.chat_schema import Conversation, Message
from typing import List, Optional
from datetime import datetime
from app.db.firestore import db

CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_SUB_COLLECTION = "messages"

class ConversationRepository:
    def __init__(self):
        self.db = db

    def _get_collection_ref(self, tenant_id: str):
        """
        Returns a reference to the 'conversations' subcollection for a specific tenant.
        """
        return self.db.collection(f'tenants/{tenant_id}/{CONVERSATIONS_COLLECTION}')

    def get_conversation_by_participants(self, tenant_id: str, participants: List[str]) -> Optional[Conversation]:
        """Finds a 1-on-1 conversation by its participants for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        sorted_participants = sorted(list(set(participants)))
        
        query = collection.where(
            filter=FieldFilter("is_team_chat", "==", False)
        ).where(
            filter=FieldFilter("participants", "==", sorted_participants)
        )
        
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            return Conversation(**data)
        return None

    def create_conversation(self, tenant_id: str, conversation_data: Conversation) -> Conversation:
        """Creates a new conversation in Firestore for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        ref = collection.document()
        conversation_data.id = ref.id
        
        data = conversation_data.model_dump(exclude_none=True)
        data["participants"] = sorted(list(set(conversation_data.participants)))
        
        ref.set(data)
        return conversation_data

    def get_user_conversations(self, tenant_id: str, user_id: str) -> List[Conversation]:
        """Retrieves all conversations for a user for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        query = collection.where(
            filter=FieldFilter("participants", "array_contains", user_id)
        ).order_by("updated_at", direction="DESCENDING")
        
        docs = query.stream()
        conversations = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            conversations.append(Conversation(**data))
        return conversations

    def get_conversation_by_id(self, tenant_id: str, conversation_id: str) -> Optional[dict]:
        """Retrieves a conversation by its ID for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        doc = collection.document(conversation_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def add_message_to_conversation(self, tenant_id: str, conversation_id: str, message_data: Message) -> Message:
        """Adds a message and updates the parent conversation for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        convo_ref = collection.document(conversation_id)
        
        message_ref = convo_ref.collection(MESSAGES_SUB_COLLECTION).document()
        message_data.id = message_ref.id
        message_data.timestamp = datetime.utcnow()
        
        message_dict = message_data.model_dump(exclude_none=True)
        message_ref.set(message_dict)

        convo_ref.update({
            "last_message": message_dict,
            "updated_at": message_data.timestamp
        })
        
        return message_data

    def get_messages_for_conversation(self, tenant_id: str, conversation_id: str, limit: int = 50) -> List[Message]:
        """Retrieves messages for a conversation for a specific tenant."""
        collection = self._get_collection_ref(tenant_id)
        messages_ref = collection.document(conversation_id).collection(MESSAGES_SUB_COLLECTION)
        query = messages_ref.order_by("timestamp", direction="ASCENDING").limit(limit)
        
        docs = query.stream()
        messages = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            messages.append(Message(**data))
        return messages
