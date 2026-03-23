from fastapi import Depends, HTTPException, status
from firebase_admin import auth
from typing import Optional, List

from app.repository.user_repository import UserRepository, get_user_repository
from app.schemas.user import UserCreate


class UserService:
    def __init__(self, user_repository: UserRepository = Depends(get_user_repository)):
        self.user_repository = user_repository

    async def get_all_users(self, tenant_id: str) -> List[dict]:
        """Retrieves all user profiles for a specific tenant."""
        return await self.user_repository.get_all(tenant_id)

    async def get_user_by_id(self, tenant_id: str, user_id: str) -> Optional[dict]:
        """Retrieves a user profile from a specific tenant by their UID."""
        return await self.user_repository.get_by_id(tenant_id, user_id)

    async def get_users_with_capability(self, tenant_id: str, capability: str) -> List[dict]:
        """Retrieves all users with a specific capability for a tenant."""
        return await self.user_repository.get_users_with_capability(tenant_id, capability)

    async def get_users_with_capabilities(self, tenant_id: str, capabilities: list) -> List[dict]:
        """Retrieves all users with any of the specified capabilities for a tenant."""
        return await self.user_repository.get_users_with_capabilities(tenant_id, capabilities)

    async def update_user_capabilities(self, tenant_id: str, user_id: str, capabilities: list):
        """
        Updates capabilities for a user in both Firestore and their Firebase Auth custom claims.
        This is the single source of truth for updating user capabilities.
        """
        # First, update the custom claims in Firebase Auth.
        # It's critical to merge with existing claims to not wipe out the tenantId.
        try:
            user_record = auth.get_user(user_id)
            existing_claims = user_record.custom_claims or {}
            new_claims = {**existing_claims, "capabilities": capabilities}
            auth.set_custom_user_claims(user_id, new_claims)
        except Exception as e:
            print(f"CRITICAL: Failed to update custom claims for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update user authorization state.")

        # Then, update the capabilities in the Firestore document for consistency.
        return await self.user_repository.update_capabilities(tenant_id, user_id, capabilities)

    async def invite_user(self, tenant_id: str, user_in: UserCreate) -> dict:
        """
        Full logic to invite a new user to a specific tenant.
        Creates the user in Firebase Auth, sets their custom claims (tenantId and capabilities),
        and creates their user profile in Firestore.
        """
        try:
            auth.get_user_by_email(user_in.email)
            raise ValueError(f"A user with email {user_in.email} already exists in the system.")
        except auth.UserNotFoundError:
            pass # Good, the user doesn't exist yet.
        except Exception as e:
            raise RuntimeError(f"An unexpected error occurred while checking for user: {e}")

        uid = None
        try:
            # 1. Create user in Firebase Auth
            firebase_user = auth.create_user(
                email=user_in.email,
                password=user_in.password,
                display_name=user_in.name
            )
            uid = firebase_user.uid

            # 2. Set custom claims: tenantId and capabilities
            claims = {
                "tenantId": tenant_id,
                "capabilities": user_in.capabilities
            }
            auth.set_custom_user_claims(uid, claims)

            # 3. Create the user profile in the tenant's Firestore subcollection
            user_profile_data = {
                "name": user_in.name,
                "email": user_in.email,
                "capabilities": user_in.capabilities, # Store capabilities in Firestore as well
                "tenantId": tenant_id
            }
            await self.user_repository.create(tenant_id, uid, user_profile_data)
            
            # 4. Return the full user profile
            return await self.user_repository.get_by_id(tenant_id, uid)

        except Exception as e:
            if uid:
                auth.delete_user(uid) # Clean up failed user creation
            raise RuntimeError(f"Failed to create user profile and set claims: {e}")