from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.base_query import FieldFilter
from typing import List, Dict, Any
from app.db.firestore import db
from datetime import datetime

class LeadRepository:
    """
    This class handles all database interactions for leads within a specific tenant.
    All methods require a tenant_id to ensure data is properly isolated.
    """
    def __init__(self):
        self.db = db

    def _get_collection_ref(self, tenant_id: str):
        """
        Returns a reference to the 'leads' subcollection for a specific tenant.
        """
        return self.db.collection(f'tenants/{tenant_id}/leads')

    def get_ref(self, tenant_id: str, lead_id: str):
        """Gets a document reference for a specific lead."""
        return self._get_collection_ref(tenant_id).document(lead_id)

    def get_by_email(self, tenant_id: str, email: str):
        """Fetches a single lead document by email for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.where(filter=FieldFilter('email', '==', email)).limit(1).stream()

    def create(self, tenant_id: str, lead_data: Dict[str, Any]):
        """Creates a new lead document in Firestore for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        new_lead_ref = collection_ref.document()
        new_lead_ref.set(lead_data)
        return new_lead_ref

    def get_by_id(self, tenant_id: str, lead_id: str):
        """Fetches a single lead document by its ID for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.document(lead_id).get()

    def get_by_ids(self, tenant_id: str, lead_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetches multiple lead documents by a list of their IDs."""
        if not lead_ids:
            return []
        
        collection_ref = self._get_collection_ref(tenant_id)
        
        # CORRECT: Firestore's 'in' query on '__name__' requires DocumentReference objects, not strings.
        lead_refs = [collection_ref.document(lead_id) for lead_id in lead_ids]
        
        # Use the list of DocumentReference objects in the query
        query = collection_ref.where(filter=FieldFilter('__name__', 'in', lead_refs))
        docs = query.stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        return results

    def update(self, tenant_id: str, lead_id: str, update_payload: Dict[str, Any]):
        """Updates a lead document by its ID for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        collection_ref.document(lead_id).update(update_payload)

    def delete(self, tenant_id: str, lead_id: str):
        """Deletes a lead document by its ID for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        collection_ref.document(lead_id).delete()

    def get_leads_by_emails(self, tenant_id: str, emails: List[str]):
        """Fetches leads by a list of emails for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.where(filter=FieldFilter('email', 'in', emails)).stream()

    def get_all_leads(self, tenant_id: str):
        """Fetches all lead documents from the Firestore collection for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.stream()

    def get_assigned_leads(self, tenant_id: str, agent_id: str, filter_status: str | None = None, start_after_doc: Any = None, limit: int = 25):
        """Fetches leads assigned to a specific agent with optional filtering and pagination for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("assignedAgent", "==", agent_id))
        if filter_status:
            query = query.where(filter=FieldFilter("status", "==", filter_status))
        query = query.order_by("name")
        if start_after_doc:
            query = query.start_after(start_after_doc)
        return query.limit(limit).stream()

    def get_leads_by_generator(self, tenant_id: str, generator_id: str, limit: int = None):
        """Fetches all leads created by a specific user (generator), with an optional limit."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("generatorId", "==", generator_id))
        if limit:
            query = query.order_by("createdAt", direction="DESCENDING").limit(limit)
        return query.stream()

    def get_leads_by_generator_in_range(self, tenant_id: str, generator_id: str, start_date: datetime, end_date: datetime):
        """Fetches all leads created by a specific user within a date range."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("generatorId", "==", generator_id))
        query = query.where(filter=FieldFilter("createdAt", ">=", start_date))
        query = query.where(filter=FieldFilter("createdAt", "<=", end_date))
        return query.stream()

    def get_all_generated_leads(self, tenant_id: str, limit: int = None):
        """Fetches all leads that have a generatorId, with an optional limit."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("generatorId", "!=", None))
        if limit:
            query = query.order_by("createdAt", direction="DESCENDING").limit(limit)
        return query.stream()

    def get_all_nurturing_leads(self, tenant_id: str):
        """Fetches all leads in the nurturing pipeline for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        nurturing_statuses = [
            "Assigned", "Contacted", "Follow-up", 
            "Called", "Rescheduled", "Interested", "Not Interested"
        ]
        query = collection_ref.where(filter=FieldFilter("status", "in", nurturing_statuses))
        return query.stream()

    def get_all_assigned_leads(self, tenant_id: str, filter_status: str | None = None, start_after_doc: Any = None, limit: int = 25):
        """Fetches all assigned leads for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("assignedAgent", "!=", None))
        if filter_status:
            query = query.where(filter=FieldFilter("status", "==", filter_status))
        query = query.order_by("name")
        if start_after_doc:
            query = query.start_after(start_after_doc)
        return query.limit(limit).stream()

    def get_assigned_leads(self, tenant_id: str, agent_id: str):
        """Fetches a user's lead summary document."""
        summary_doc = self.db.collection("user_lead_summaries").document(agent_id).get()
        if summary_doc.exists:
            return summary_doc.to_dict().get("leads", [])
        return []

    def get_nurturing_queue(self, tenant_id: str, nurturer_id: str):
        """Fetches a user's lead summary document."""
        summary_doc = self.db.collection("user_lead_summaries").document(nurturer_id).get()
        if summary_doc.exists:
            return summary_doc.to_dict().get("leads", [])
        return []

    def get_closed_won_leads(self, tenant_id: str):
        """Fetches all leads with the status 'Closed - Won' for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("status", "==", "Closed - Won"))
        return query.stream()

    from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.base_query import FieldFilter
from typing import List, Dict, Any
from app.db.firestore import db
from datetime import datetime

class LeadRepository:
    def __init__(self):
        self.db: AsyncClient = db

    def _get_collection_ref(self, tenant_id: str):
        return self.db.collection(f'tenants/{tenant_id}/leads')

    def get_ref(self, tenant_id: str, lead_id: str):
        return self._get_collection_ref(tenant_id).document(lead_id)

    async def get_by_email(self, tenant_id: str, email: str):
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.where(filter=FieldFilter('email', '==', email)).limit(1).stream()

    async def create(self, tenant_id: str, lead_data: Dict[str, Any]):
        collection_ref = self._get_collection_ref(tenant_id)
        new_lead_ref = collection_ref.document()
        await new_lead_ref.set(lead_data)
        return new_lead_ref

    async def get_by_id(self, tenant_id: str, lead_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        return await collection_ref.document(lead_id).get()

    async def get_by_ids(self, tenant_id: str, lead_ids: List[str]) -> List[Dict[str, Any]]:
        if not lead_ids: return []
        collection_ref = self._get_collection_ref(tenant_id)
        lead_refs = [collection_ref.document(lead_id) for lead_id in lead_ids]
        query = collection_ref.where(filter=FieldFilter('__name__', 'in', lead_refs))
        docs = query.stream()
        results = []
        async for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        return results

    async def update(self, tenant_id: str, lead_id: str, update_payload: Dict[str, Any]):
        collection_ref = self._get_collection_ref(tenant_id)
        await collection_ref.document(lead_id).update(update_payload)

    async def delete(self, tenant_id: str, lead_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        await collection_ref.document(lead_id).delete()

    def get_leads_by_emails(self, tenant_id: str, emails: List[str]):
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.where(filter=FieldFilter('email', 'in', emails)).stream()

    def get_all_leads(self, tenant_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        return collection_ref.stream()

    def get_assigned_leads(self, tenant_id: str, agent_id: str, filter_status: str | None = None, start_after_doc: Any = None, limit: int = 25):
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("assignedAgent", "==", agent_id))
        if filter_status: query = query.where(filter=FieldFilter("status", "==", filter_status))
        query = query.order_by("name")
        if start_after_doc: query = query.start_after(start_after_doc)
        return query.limit(limit).stream()

    def get_leads_by_generator(self, tenant_id: str, generator_id: str, limit: int = None):
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("generatorId", "==", generator_id))
        if limit: query = query.order_by("createdAt", direction="DESCENDING").limit(limit)
        return query.stream()

    async def get_leads_by_generator_in_range(self, tenant_id: str, generator_id: str, start_date: datetime, end_date: datetime):
        """Fetches all leads created by a specific user within a date range."""
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("generatorId", "==", generator_id))
        query = query.where(filter=FieldFilter("createdAt", ">=", start_date))
        query = query.where(filter=FieldFilter("createdAt", "<=", end_date))
        return query.stream()

    def get_all_nurturing_leads(self, tenant_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        nurturing_statuses = ["Assigned", "Contacted", "Follow-up", "Called", "Rescheduled", "Interested", "Not Interested"]
        query = collection_ref.where(filter=FieldFilter("status", "in", nurturing_statuses))
        return query.stream()

    def get_all_assigned_leads(self, tenant_id: str, filter_status: str | None = None, start_after_doc: Any = None, limit: int = 25):
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("assignedAgent", "!=", None))
        if filter_status: query = query.where(filter=FieldFilter("status", "==", filter_status))
        query = query.order_by("name")
        if start_after_doc: query = query.start_after(start_after_doc)
        return query.limit(limit).stream()

    def get_closed_won_leads(self, tenant_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where(filter=FieldFilter("status", "==", "Closed - Won"))
        return query.stream()

    def get_all_assigned_and_nurturing_leads(self, tenant_id: str):
        collection_ref = self._get_collection_ref(tenant_id)
        nurturing_leads = collection_ref.where(filter=FieldFilter("assignedNurturer", "!=", None)).stream()
        closing_leads = collection_ref.where(filter=FieldFilter("assignedAgent", "!=", None)).stream()
        all_leads = list(nurturing_leads) + list(closing_leads)
        unique_leads = {lead.id: lead for lead in all_leads}
        return unique_leads.values()


def get_lead_repository():
    return LeadRepository()

