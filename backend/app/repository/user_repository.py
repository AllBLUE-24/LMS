# FILE: app/repository/user_repository.py

from google.cloud.firestore_v1.async_client import AsyncClient
from app.db.firestore import db

class UserRepository:
    """
    This class handles all database interactions for users within a specific tenant.
    All methods require a tenant_id to ensure data is properly isolated.
    """
    def __init__(self):
        self.db: AsyncClient = db

    def _get_collection_ref(self, tenant_id: str):
        """
        Returns a reference to the 'users' subcollection for a specific tenant.
        """
        return self.db.collection(f'tenants/{tenant_id}/users')

    async def create(self, tenant_id: str, uid: str, data: dict):
        """Creates a new user document in Firestore for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        await collection_ref.document(uid).set(data)
    
    async def get_all(self, tenant_id: str) -> list:
        """
        Fetches all user documents from the Firestore collection for a specific tenant.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        users_list = []
        async for doc in collection_ref.stream():
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            users_list.append(user_data)
        return users_list

    async def get_by_id(self, tenant_id: str, user_id: str):
        """Fetches a single user document by its ID for a specific tenant."""
        collection_ref = self._get_collection_ref(tenant_id)
        user_doc = await collection_ref.document(user_id).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_data['id'] = user_doc.id
            return user_data
        return None

    async def update_capabilities(self, tenant_id: str, user_id: str, capabilities: list):
        """Updates the capabilities for a specific user in their Firestore document."""
        collection_ref = self._get_collection_ref(tenant_id)
        await collection_ref.document(user_id).update({"capabilities": capabilities})

    async def get_users_with_capability(self, tenant_id: str, capability: str) -> list:
        """
        Fetches all users that have a specific capability.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where("capabilities", "array_contains", capability)
        users_list = []
        async for doc in query.stream():
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            users_list.append(user_data)
        return users_list

    async def get_users_with_capabilities(self, tenant_id: str, capabilities: list) -> list:
        """
        Fetches all users that have any of the specified capabilities.
        """
        collection_ref = self._get_collection_ref(tenant_id)
        query = collection_ref.where("capabilities", "array_contains_any", capabilities)
        users_list = []
        async for doc in query.stream():
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            users_list.append(user_data)
        return users_list

def get_user_repository():
    return UserRepository()
