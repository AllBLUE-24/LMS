# FILE: app/api/v1/users.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from google.cloud.firestore_v1.client import Client
from firebase_admin import auth

from app.schemas.user import User, UserCreate, UserUpdateCapabilities
from app.db.firestore import get_db
# We will create the dependency for checking admin privileges next
# from app.api.deps import get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_all_users(db: Client = Depends(get_db)):
    # In a real app, you'd add dependency injection here to ensure only an admin can call this.
    # For now, we'll allow it.
    users_ref = db.collection('users')
    users_list = []
    for doc in users_ref.stream():
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        users_list.append(user_data)
    return users_list

@router.post("/invite", response_model=User)
async def invite_new_user(user_in: UserCreate, db: Client = Depends(get_db)):
    """
    Invites a new user. This creates an account in Firebase Auth
    and a corresponding user profile in Firestore.
    """
    try:
        # Create user in Firebase Authentication
        firebase_user = auth.create_user(
            email=user_in.email,
            password=user_in.password,
            display_name=user_in.name
        )
        uid = firebase_user.uid
        print(f"Successfully created user {uid} in Firebase Auth.")

        # Create user profile in Firestore
        user_profile_data = {
            "name": user_in.name,
            "email": user_in.email,
            "capabilities": user_in.capabilities,
            "organizationId": "default_org" # In a multi-tenant app, this would be dynamic
        }
        db.collection('users').document(uid).set(user_profile_data)
        print(f"Successfully created user profile for {uid} in Firestore.")

        return User(id=uid, **user_profile_data)

    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    except Exception as e:
        # Clean up in case of failure
        if 'uid' in locals():
            auth.delete_user(uid)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@router.put("/{user_id}/capabilities", response_model=User)
async def update_user_capabilities(user_id: str, new_caps: UserUpdateCapabilities, db: Client = Depends(get_db)):
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found in Firestore.")
    
    user_ref.update({"capabilities": new_caps.capabilities})

    updated_doc = user_ref.get()
    return User(id=updated_doc.id, **updated_doc.to_dict())