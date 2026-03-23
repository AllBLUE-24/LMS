from fastapi import Depends
from app.repository.conversation_repository import ConversationRepository
from app.schemas.chat_schema import Conversation, Message
from app.services.user_service import UserService
from typing import List, Optional

class ChatService:
    def __init__(self, 
                 conversation_repository: ConversationRepository = Depends(),
                 user_service: UserService = Depends()):
        self.repo = conversation_repository
        self.user_service = user_service

    def start_or_get_conversation(self, tenant_id: str, current_user_id: str, target_user_id: str) -> Conversation:
        """
        Starts a new 1-on-1 conversation or retrieves an existing one within a tenant.
        """
        if current_user_id == target_user_id:
            raise ValueError("Cannot start a conversation with oneself.")
            
        target_user = self.user_service.get_user_by_id(tenant_id, target_user_id)
        if not target_user:
            raise ValueError("Target user not found in this tenant.")

        participants = sorted([current_user_id, target_user_id])
        
        conversation = self.repo.get_conversation_by_participants(tenant_id, participants)
        if conversation:
            return conversation

        new_conversation = Conversation(participants=participants)
        return self.repo.create_conversation(tenant_id, new_conversation)

    def send_message(self, tenant_id: str, conversation_id: str, sender_id: str, content: str) -> Message:
        """
        Sends a message to a conversation within a tenant.
        """
        conversation = self.repo.get_conversation_by_id(tenant_id, conversation_id)
        if not conversation or sender_id not in conversation['participants']:
            raise PermissionError("User is not a participant of this conversation.")

        message = Message(sender_id=sender_id, content=content)
        return self.repo.add_message_to_conversation(tenant_id, conversation_id, message)

    def get_user_conversations(self, tenant_id: str, user_id: str) -> List[Conversation]:
        """Gets all conversations for a user within a tenant."""
        return self.repo.get_user_conversations(tenant_id, user_id)

    def get_conversation_messages(self, tenant_id: str, conversation_id: str, user_id: str) -> List[Message]:
        """
        Gets messages for a conversation if the user is a participant within a tenant.
        """
        conversation = self.repo.get_conversation_by_id(tenant_id, conversation_id)
        if not conversation or user_id not in conversation['participants']:
            raise PermissionError("User is not authorized to view this conversation.")
        return self.repo.get_messages_for_conversation(tenant_id, conversation_id)

    def get_conversation_by_id(self, tenant_id: str, conversation_id: str) -> Optional[dict]:
        """Gets a conversation by its ID within a tenant."""
        return self.repo.get_conversation_by_id(tenant_id, conversation_id)
