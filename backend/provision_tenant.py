import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
import os
from dotenv import load_dotenv
from collections import Counter

def provision_tenant(tenant_id: str, user_uid: str, user_profile_data: dict, perform_backfill: bool = True):
    """
    Provisions a new tenant or repairs an existing one.

    This is now the single source of truth for tenant setup. It:
    1. Sets the admin user's custom claims for proper access.
    2. Creates the user's profile document in Firestore.
    3. Ensures all necessary collections exist.
    4. (Optional) Performs an atomic backfill of lead statistics.
    """
    try:
        if not firebase_admin._apps:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return

    print(f"Starting provisioning for Tenant ID: {tenant_id}...")

    # --- Step 1: Set Custom Claims ---
    if user_uid:
        try:
            print(f"Setting custom claims for user UID {user_uid}...")
            # Define the custom claims in the format the application expects.
            # The 'capabilities' list is checked by the API dependencies.
            custom_claims = {
                'tenantId': tenant_id,
                'capabilities': ['is_admin', 'can_nurture_leads', 'can_close_leads']
            }
            auth.set_custom_user_claims(user_uid, custom_claims)
            print("[SUCCESS] Custom claims set.")
        except Exception as e:
            print(f"[ERROR] Failed to set custom claims: {e}")
            return

    tenant_ref = db.collection('tenants').document(tenant_id)

    # --- Step 2: Create User Profile in Firestore ---
    if user_uid and user_profile_data:
        user_doc_ref = tenant_ref.collection('users').document(user_uid)
        if not user_doc_ref.get().exists:
            print(f"Creating user profile for UID {user_uid}...")
            user_doc_ref.set(user_profile_data)
        else:
            print(f"User profile for UID {user_uid} already exists.")

    # --- Step 3: Ensure Core Collections Exist ---
    required_collections = ["users", "activities", "conversations", "tasks", "statistics", "leads", "notifications"]
    for collection_name in required_collections:
        collection_ref = tenant_ref.collection(collection_name)
        docs = list(collection_ref.limit(1).stream())
        if not docs:
            print(f"Collection '{collection_name}' is missing or empty. Creating placeholder...")
            placeholder_ref = collection_ref.document('_placeholder')
            placeholder_ref.set({'initialized': True})
        else:
            print(f"Collection '{collection_name}' already exists.")

    # --- Step 4: Atomic Statistics Backfill ---
    if perform_backfill:
        print("\nStarting atomic statistics backfill...")
        try:
            leads_ref = tenant_ref.collection("leads")
            all_leads = leads_ref.stream()

            stats_calculator = {
                "totalLeads": 0,
                "leadsBySource": Counter(),
                "leadsByLocation": Counter(),
                "leadsByAssignedAgent": Counter(),
                "leadsByStatus": Counter()
            }

            for lead in all_leads:
                lead_data = lead.to_dict()
                stats_calculator["totalLeads"] += 1
                if lead_data.get("source"):
                    stats_calculator["leadsBySource"][lead_data["source"]] += 1
                if lead_data.get("location"):
                    stats_calculator["leadsByLocation"][lead_data["location"]] += 1
                if lead_data.get("assignedAgent"):
                    stats_calculator["leadsByAssignedAgent"][lead_data["assignedAgent"]] += 1
                if lead_data.get("status"):
                    stats_calculator["leadsByStatus"][lead_data["status"]] += 1
            
            final_stats = {
                "totalLeads": stats_calculator["totalLeads"],
                "leadsBySource": dict(stats_calculator["leadsBySource"]),
                "leadsByLocation": dict(stats_calculator["leadsByLocation"]),
                "leadsByAssignedAgent": dict(stats_calculator["leadsByAssignedAgent"]),
                "leadsByStatus": dict(stats_calculator["leadsByStatus"]),
                "lastBackfilled": SERVER_TIMESTAMP
            }

            dashboard_ref = tenant_ref.collection("statistics").document("dashboard")
            dashboard_ref.set(final_stats)
            print("[SUCCESS] Atomic backfill completed.")

        except Exception as e:
            print(f"[ERROR] An error occurred during statistics backfill: {e}")

    print(f"\n[SUCCESS] Tenant '{tenant_id}' has been successfully provisioned.")

if __name__ == "__main__":
    load_dotenv()

    # --- CONFIGURATION ---
    TENANT_ID = "test_client4"
    ADMIN_USER_UID = "CtH9mWOxOwPK5ExgN6pyDyV4I6g2" # <--- IMPORTANT: SET THIS
    USER_PROFILE_DATA = {
        "name": "Test4 Admin",
        "email": "test4@client.com", # <--- IMPORTANT: SET THIS
        "capabilities": ["is_admin"],
        "tenantId": TENANT_ID
    }
    PERFORM_BACKFILL = True
    # ---------------------

    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("FATAL ERROR: The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.")
    else:
        if "YOUR_ADMIN_UID_HERE" in ADMIN_USER_UID:
            print("FATAL ERROR: Please configure the ADMIN_USER_UID in the script before running.")
        else:
            provision_tenant(TENANT_ID, ADMIN_USER_UID, USER_PROFILE_DATA, PERFORM_BACKFILL)
