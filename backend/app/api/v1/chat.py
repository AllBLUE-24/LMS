from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Query, status
from pydantic import BaseModel
from typing import List, Dict
import logging
import json

from app.services.chat_service import ChatService
from app.schemas.chat_schema import Conversation, Message
from app.api.v1.dependencies import get_current_user, get_current_user_with_claims

# --- SETUP ---
router = APIRouter()

# --- CLASS & MODEL DEFINITIONS ---

class ConnectionManager:
    """Manages active WebSocket connections for chat conversations."""
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)
        logging.info(f"WebSocket connected to conversation {conversation_id}")

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        logging.info(f"WebSocket disconnected from conversation {conversation_id}")

    async def broadcast(self, conversation_id: str, message: str):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                await connection.send_text(message)

class StartConversationRequest(BaseModel):
    """Request model for starting a new conversation."""
    target_user_id: str

# --- GLOBAL INSTANCES ---
manager = ConnectionManager()

# --- API ENDPOINTS ---

@router.post("/conversations", response_model=Conversation, summary="Start or Get Conversation")
def start_conversation_route(
    request: StartConversationRequest,
    auth: dict = Depends(get_current_user),
    chat_service: ChatService = Depends()
):
    """Starts a 1-on-1 conversation with another user within the tenant."""
    try:
        return chat_service.start_or_get_conversation(auth['tenant_id'], auth['uid'], request.target_user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/conversations", response_model=List[Conversation], summary="Get User Conversations")
def get_user_conversations_route(
    auth: dict = Depends(get_current_user),
    chat_service: ChatService = Depends()
):
    """Gets all of the current user's conversations within their tenant."""
    return chat_service.get_user_conversations(auth['tenant_id'], auth['uid'])

@router.get("/conversations/{conversation_id}/messages", response_model=List[Message], summary="Get Conversation Messages")
def get_conversation_messages_route(
    conversation_id: str,
    auth: dict = Depends(get_current_user),
    chat_service: ChatService = Depends()
):
    """Gets the messages for a specific conversation within the tenant."""
    try:
        return chat_service.get_conversation_messages(auth['tenant_id'], conversation_id, auth['uid'])
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    token: str = Query(...),
    chat_service: ChatService = Depends()
):
    """WebSocket endpoint for real-time chat within a tenant."""
    try:
        # Manually verify token and get claims
        decoded_token = get_current_user_with_claims.__wrapped__(token)
        tenant_id = decoded_token.get("tenantId")
        user_id = decoded_token.get("uid")

        if not tenant_id or not user_id:
            await websocket.close(code=1008)
            return

        # Verify user is part of the conversation in the correct tenant
        conversation = chat_service.get_conversation_by_id(tenant_id, conversation_id)
        if not conversation or user_id not in conversation['participants']:
            await websocket.close(code=1008)
            return

    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            content = message_data.get("content")
            
            if content:
                sent_message = chat_service.send_message(
                    tenant_id=tenant_id,
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content
                )
                await manager.broadcast(conversation_id, sent_message.model_dump_json())

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception as e:
        logging.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket, conversation_id)
