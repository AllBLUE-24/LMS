# backend/app/repository/user_lead_summary_repository.py
from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.document import DocumentReference
from typing import Optional
from fastapi import Depends

from app.schemas.user_lead_summary import UserLeadSummary
from app.db.firestore import get_db

class UserLeadSummaryRepository:
    def __init__(self, db: AsyncClient):
        self.db = db
        self.collection = self.db.collection('user_lead_summaries')

    async def get(self, user_id: str) -> Optional[UserLeadSummary]:
        """Fetches a user's lead summary document."""
        doc = await self.collection.document(user_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return UserLeadSummary.parse_obj(data)
        return None

    def _get_ref(self, user_id: str) -> DocumentReference:
        """Gets a document reference for a user's summary."""
        return self.collection.document(user_id)

def get_user_lead_summary_repository(db: AsyncClient = Depends(get_db)) -> UserLeadSummaryRepository:
    """Dependency injector for the repository."""
    return UserLeadSummaryRepository(db)
