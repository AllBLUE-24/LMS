import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

def migrate_data():
    """
    Migrates all data from the old flat collections into a single, specified tenant.
    This is a one-time script to consolidate legacy data.
    """
    # --- CONFIGURATION ---
    # Define the single tenant where all old data will be moved.
    TARGET_TENANT_ID = "test_client1"
    
    # List of old top-level collections to migrate.
    COLLECTIONS_TO_MIGRATE = ['users', 'leads', 'tasks', 'activities', 'conversations', 'notifications', 'statistics']
    # ---------------------

    # Load environment variables from .env file
    load_dotenv()
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("FATAL ERROR: The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.")
        print("Please ensure the path in your .env file is correct and the file is accessible.")
        return

    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return

    print(f"Starting data migration into tenant: '{TARGET_TENANT_ID}'...")

    for collection_name in COLLECTIONS_TO_MIGRATE:
        print(f"\n--- Migrating collection: {collection_name} ---")
        old_collection_ref = db.collection(collection_name)
        
        try:
            docs = old_collection_ref.stream()
        except Exception as e:
            print(f"  [! ] Could not read collection '{collection_name}'. It might not exist. Skipping. Error: {e}")
            continue

        migrated_count = 0
        
        for doc in docs:
            doc_data = doc.to_dict()
            doc_id = doc.id

            # Define the new location for the document inside the target tenant
            new_doc_ref = db.collection('tenants').document(TARGET_TENANT_ID).collection(collection_name).document(doc_id)

            try:
                # Write the document to the new location
                new_doc_ref.set(doc_data)
                
                # --- DANGER ZONE ---
                # Uncomment the line below ONLY after a successful dry run to delete the old document.
                old_collection_ref.document(doc_id).delete()
                # -------------------
                
                print(f"  [->] Migrated document {doc_id} to tenant '{TARGET_TENANT_ID}'.")
                migrated_count += 1

            except Exception as e:
                print(f"  [X] FAILED to migrate document {doc_id}. Error: {e}")
        
        if migrated_count == 0:
            print(f"--- No documents found or migrated in '{collection_name}'. ---")
        else:
            print(f"--- Finished migrating {collection_name}: {migrated_count} migrated. ---")

    print("\nData migration script finished.")
    print("IMPORTANT: This was a DRY RUN. No old data was deleted.")
    print("1. Verify the data in the Firestore console under `/tenants/test_client1/`.")
    print("2. If correct, uncomment the `delete()` line in the script and run again to complete the move.")


if __name__ == "__main__":
    migrate_data()
