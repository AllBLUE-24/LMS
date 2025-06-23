# app/db/firestore.py

import firebase_admin
from firebase_admin import credentials, firestore

# --- Firebase Initialization ---

# Ensure your serviceAccountKey.json is in the root of the lms-backend folder.
# IMPORTANT: Add "serviceAccountKey.json" to your .gitignore file.
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firestore connection successful.")
except Exception as e:
    print(f"Error initializing Firestore: {e}")
    # In a real app, you might want to handle this more gracefully,
    # but for now, we'll allow it to fail loudly if the key is missing.
    db = None

def get_db():
    """
    A dependency function to get the database client.
    In a more complex app, this could handle connection pooling.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")
    return db

