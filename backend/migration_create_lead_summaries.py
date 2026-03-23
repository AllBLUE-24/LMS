# backend/migration_create_lead_summaries.py
import os
import sys
from google.cloud import firestore

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.repository.lead_repository import LeadRepository
from backend.app.repository.user_lead_summary_repository import UserLeadSummaryRepository
from backend.app.schemas.user_lead_summary import LeadSummary

def migrate_lead_summaries():
    """
    One-time migration script to create user_lead_summary documents for all existing assigned leads.
    """
    db = firestore.Client()
    lead_repo = LeadRepository()
    summary_repo = UserLeadSummaryRepository(db)
    
    print("Starting migration to create user lead summaries...")

    all_tenants = [tenant.id for tenant in db.collection('tenants').stream()]
    print(f"DEBUG: Found the following tenants in the database: {all_tenants}")
    
    for tenant_id in all_tenants:
        print(f"Processing tenant: {tenant_id}")
        
        leads_by_user = {} # {user_id: [LeadSummary, ...]}

        # Get all leads that have a nurturer or a closer assigned
        all_assigned_leads = lead_repo.get_all_assigned_and_nurturing_leads(tenant_id)

        for lead_doc in all_assigned_leads:
            lead_data = lead_doc.to_dict()
            lead_id = lead_doc.id
            
            assigned_user_id = lead_data.get("assignedNurturer") or lead_data.get("assignedAgent")
            
            if not assigned_user_id:
                continue

            # Create the lead summary object
            summary = LeadSummary(
                id=lead_id,
                name=lead_data.get("name", "N/A"),
                status=lead_data.get("status", "N/A"),
                next_call_date=lead_data.get("next_call_date")
            )

            # Group summaries by user
            if assigned_user_id not in leads_by_user:
                leads_by_user[assigned_user_id] = []
            leads_by_user[assigned_user_id].append(summary.model_dump())

        # Now, write each user's summary document
        if not leads_by_user:
            print(f"No assigned leads found for tenant {tenant_id}. Nothing to migrate.")
            continue

        print(f"Found {len(leads_by_user)} users with assigned leads in tenant {tenant_id}. Writing summaries...")
        
        for user_id, summaries in leads_by_user.items():
            try:
                summary_ref = summary_repo._get_ref(user_id)
                # Using set with merge=True will create or overwrite the leads field
                summary_ref.set({'leads': summaries}, merge=True)
                print(f"  - Successfully created/updated summary for user {user_id} with {len(summaries)} leads.")
            except Exception as e:
                print(f"  - FAILED to create/update summary for user {user_id}. Error: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    # You need to have Google Cloud credentials configured in your environment
    # for this script to work. (e.g., run `gcloud auth application-default login`)
    migrate_lead_summaries()
