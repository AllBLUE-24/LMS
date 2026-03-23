from ..db.firestore import db
from ..schemas.activity import Activity
from typing import List, Optional
from google.cloud.firestore_v1.base_query import FieldFilter

class ActivityRepository:
    def __init__(self):
        self.db = db

    def _get_collection_ref(self, tenant_id: str):
        """
        Returns a reference to the 'activities' subcollection for a specific tenant.
        """
        return self.db.collection(f'tenants/{tenant_id}/activities')

    async def get_by_lead_id(self, tenant_id: str, lead_id: str) -> List[Activity]:
        """Fetches activities for a specific lead within a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        activities = []
        docs_stream = collection_ref.where(filter=FieldFilter('lead_id', '==', lead_id)).order_by('timestamp', direction='DESCENDING').stream()
        async for doc in docs_stream:
            activity_data = doc.to_dict()
            activity_data['id'] = doc.id
            activities.append(Activity(**activity_data))
        return activities

    async def add(self, tenant_id: str, activity: Activity) -> Activity:
        """Adds a new activity for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        doc_ref = collection_ref.document()
        activity.id = doc_ref.id
        await doc_ref.set(activity.dict(by_alias=True))
        return activity

    def add_to_batch(self, tenant_id: str, batch, activity: Activity):
        """
        Adds a new activity to a Firestore batch for a specific tenant.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        doc_ref = collection_ref.document()
        activity.id = doc_ref.id
        batch.set(doc_ref, activity.dict(by_alias=True))
