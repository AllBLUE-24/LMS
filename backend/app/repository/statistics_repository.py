from google.cloud.firestore_v1.async_client import AsyncClient
from app.db.firestore import db

class StatisticsRepository:
    def __init__(self):
        self.db: AsyncClient = db

    async def get_dashboard_stats(self, tenant_id: str):
        """Retrieves the main dashboard statistics document."""
        return await self.db.collection(f'tenants/{tenant_id}/statistics').document('dashboard').get()

    async def update_dashboard_stats(self, tenant_id: str, stats_data: dict):
        """Updates or overwrites the main dashboard statistics document."""
        doc_ref = self.db.collection(f'tenants/{tenant_id}/statistics').document('dashboard')
        await doc_ref.set(stats_data)

    async def get_user_dashboard_stats(self, tenant_id: str, user_id: str):
        """Retrieves the pre-calculated dashboard statistics document for a specific user."""
        return await self.db.collection(f'tenants/{tenant_id}/user_statistics').document(user_id).get()

    async def update_user_dashboard_stats(self, tenant_id: str, user_id: str, stats_data: dict):
        """Updates or overwrites the dashboard statistics document for a specific user."""
        doc_ref = self.db.collection(f'tenants/{tenant_id}/user_statistics').document(user_id)
        await doc_ref.set(stats_data)

def get_statistics_repository():
    return StatisticsRepository()