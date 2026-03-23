# backend/migration_backfill_user_stats.py
import os
import sys
import asyncio
from google.cloud import firestore

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.repository.user_repository import UserRepository
from backend.app.services.statistics_service import StatisticsService
from backend.app.repository.lead_repository import LeadRepository
from backend.app.repository.statistics_repository import StatisticsRepository
from backend.app.repository.user_lead_summary_repository import UserLeadSummaryRepository

async def backfill_user_stats():
    """
    One-time migration script to calculate and save dashboard statistics
    for all users in all tenants based on their currently assigned leads.
    """
    db = firestore.AsyncClient()
    
    # Manual dependency injection for the service
    user_repo = UserRepository()
    lead_repo = LeadRepository()
    stats_repo = StatisticsRepository()
    summary_repo = UserLeadSummaryRepository(db)
    
    # We need to instantiate the service with its dependencies
    stats_service = StatisticsService(
        lead_repo=lead_repo,
        stats_repo=stats_repo,
        summary_repo=summary_repo
    )

    print("Starting migration to backfill user dashboard statistics...")

    tenants_ref = db.collection('tenants')
    all_tenants = [tenant.id async for tenant in tenants_ref.stream()]
    
    print(f"Found tenants: {all_tenants}")

    for tenant_id in all_tenants:
        print(f"Processing tenant: {tenant_id}")
        
        all_users = await user_repo.get_all(tenant_id)
        
        if not all_users:
            print(f"No users found for tenant {tenant_id}. Skipping.")
            continue

        print(f"Found {len(all_users)} users in tenant {tenant_id}. Updating stats for each...")
        
        for user in all_users:
            user_id = user.get('id')
            if not user_id:
                continue
            
            try:
                print(f"  - Updating stats for user {user_id}...")
                await stats_service.update_user_dashboard_statistics(tenant_id, user_id)
                print(f"  - Successfully updated stats for user {user_id}.")
            except Exception as e:
                print(f"  - FAILED to update stats for user {user_id}. Error: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    # You need to have Google Cloud credentials configured in your environment.
    asyncio.run(backfill_user_stats())
