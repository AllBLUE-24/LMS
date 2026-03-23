import firebase_admin
from firebase_admin import credentials, firestore
import os
import sys
from dotenv import load_dotenv
from pathlib import Path
from fastapi import HTTPException, status
from google.cloud.firestore_v1.async_client import AsyncClient

# ==============================================================================
#  DATABASE AND FIREBASE INITIALIZATION (RUNS ONCE ON STARTUP)
# ==============================================================================

# Build the path to the .env file in the project root
# This makes the path relative to this file's location
dotenv_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

# --- MAIN INITIALIZATION LOGIC ---
db: AsyncClient = None
try:
    # Get the service account key path from the environment variable
    service_account_key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not service_account_key_path:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set or .env file not found.")

    # Initialize Firebase with the service account file
    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_key_path)
        firebase_admin.initialize_app(cred)
    
    # The google-cloud-firestore library automatically picks up the credentials from firebase-admin.
    db = AsyncClient()
    print("\n--- Firebase Admin SDK Initialized Successfully with AsyncClient! ---\n", file=sys.stderr)

except Exception as e:
    print(f"CRITICAL: Could not initialize Firebase Admin SDK. Error: {e}", file=sys.stderr)
    db = None

def get_db() -> AsyncClient:
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database client is not available. Check server logs for initialization errors."
        )
    yield db

