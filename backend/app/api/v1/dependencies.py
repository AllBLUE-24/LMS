from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from typing import Dict
import logging # Import the logging module

from app.services.user_service import UserService
from app.db.firestore import get_db, AsyncClient

oauth2_scheme = HTTPBearer()
logger = logging.getLogger(__name__) # Add a logger

def get_current_user_with_claims(
    token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
) -> Dict:
    """
    Verifies the Firebase ID token and extracts the user's UID and custom claims.
    This is the foundation of our multi-tenant security.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="An authorization token was not provided."
        )
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided authentication token is invalid or has expired."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during token verification: {e}"
        )

async def get_current_user(
    token_data: Dict = Depends(get_current_user_with_claims),
    user_service: UserService = Depends(),
    db: AsyncClient = Depends(get_db)
) -> Dict:
    """
    Verifies the Firebase ID token, extracts claims, and returns a comprehensive
    auth object containing the user's profile, capabilities, UID, tenant ID, and db session.
    """
    uid = token_data.get("uid")
    tenant_id = token_data.get("tenantId")
    capabilities = token_data.get("capabilities", [])

    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have an associated tenant. Access denied."
        )

    # --- THE SURGICAL FIX IS HERE ---
    # We wrap the service call in a try/except block to gracefully handle
    # any unexpected errors if the user profile is missing or malformed.
    try:
        user_profile = await user_service.get_user_by_id(tenant_id, uid)
    except Exception as e:
        # If the service crashes, log the internal error and treat it as if the user was not found.
        logger.error(f"UserService failed for UID {uid} in tenant {tenant_id}: {e}", exc_info=True)
        user_profile = None
    # --- END OF FIX ---

    if not user_profile:
        # This existing logic now correctly handles both a safe return of `None`
        # and a crash within the user service.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found in the database for this tenant."
        )
    
    # Combine all info into a single dictionary
    auth_info = {
        "uid": uid,
        "tenant_id": tenant_id,
        "capabilities": capabilities,
        "user": user_profile,
        "db": db
    }
    return auth_info

def get_generator_user(current_user: dict = Depends(get_current_user)):
    user_capabilities = current_user.get('capabilities', [])
    if 'can_generate_leads' not in user_capabilities and 'is_admin' not in user_capabilities and 'head_of_generators' not in user_capabilities:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have permission to assign leads.")
    return current_user

def get_nurturer_user(current_user: dict = Depends(get_current_user)):
    user_capabilities = current_user.get('capabilities', [])
    if 'can_nurture_leads' not in user_capabilities and 'is_admin' not in user_capabilities and 'head_of_nurturers' not in user_capabilities:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have permission to nurture leads.")
    return current_user

def get_closing_agent_user(current_user: dict = Depends(get_current_user)):
    user_capabilities = current_user.get('capabilities', [])
    if 'can_close_leads' not in user_capabilities and 'is_admin' not in user_capabilities and 'head_of_closers' not in user_capabilities:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have permission to close leads.")
    return current_user

def get_admin_user(current_user: dict = Depends(get_current_user)):
    user_capabilities = current_user.get('capabilities', [])
    if 'is_admin' not in user_capabilities:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have admin privileges.")
    return current_user
