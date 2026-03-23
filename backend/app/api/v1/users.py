from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.schemas.user import User, UserCreate, UserUpdateCapabilities
from app.services.user_service import UserService
from app.api.v1.dependencies import get_current_user, get_admin_user, get_nurturer_user
from firebase_admin import auth

router = APIRouter()
# AFTER: Requires any authenticated user ,,, change again to require admin user for security purposes
@router.get("/", response_model=List[User])
async def get_all_users(
    auth: dict = Depends(get_current_user), # <-- Key change is here
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users for the current tenant.
    Requires user to be authenticated.
    """
    return await user_service.get_all_users(auth['tenant_id'])
@router.get("/closers", response_model=List[User])
async def get_closing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_close_leads' or 'head_of_closers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_close_leads', 'head_of_closers'])

@router.get("/nurturers", response_model=List[User])
async def get_nurturing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_nurture_leads' or 'head_of_nurturers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_nurture_leads', 'head_of_nurturers'])

@router.post("/invite", response_model=User)
async def invite_new_user(
    user_in: UserCreate,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Invites a new user to the current tenant. This creates an account in Firebase Auth,
    sets their tenantId and capabilities as custom claims, and creates a user profile in Firestore.
    Requires admin privileges.
    """
    try:
        created_user = await user_service.invite_user(
            tenant_id=auth['tenant_id'],
            user_in=user_in
        )
        return created_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/{user_id}/capabilities", response_model=User)
async def update_user_capabilities(
    user_id: str,
    new_caps: UserUpdateCapabilities,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Updates the capabilities for a specific user within the current tenant.
    Requires admin privileges.
    """
    user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in this tenant.")
    
    await user_service.update_user_capabilities(auth['tenant_id'], user_id, new_caps.capabilities)
    
    updated_user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    return updated_user
@router.get("/closers", response_model=List[User])
async def get_closing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_close_leads' or 'head_of_closers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_close_leads', 'head_of_closers'])

@router.get("/nurturers", response_model=List[User])
async def get_nurturing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_nurture_leads' or 'head_of_nurturers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_nurture_leads', 'head_of_nurturers'])

@router.post("/invite", response_model=User)
async def invite_new_user(
    user_in: UserCreate,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Invites a new user to the current tenant. This creates an account in Firebase Auth,
    sets their tenantId and capabilities as custom claims, and creates a user profile in Firestore.
    Requires admin privileges.
    """
    try:
        created_user = await user_service.invite_user(
            tenant_id=auth['tenant_id'],
            user_in=user_in
        )
        return created_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/{user_id}/capabilities", response_model=User)
async def update_user_capabilities(
    user_id: str,
    new_caps: UserUpdateCapabilities,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Updates the capabilities for a specific user within the current tenant.
    Requires admin privileges.
    """
    user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in this tenant.")
    
    await user_service.update_user_capabilities(auth['tenant_id'], user_id, new_caps.capabilities)
    
    updated_user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    return updated_user
@router.get("/closers", response_model=List[User])
async def get_closing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_close_leads' or 'head_of_closers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_close_leads', 'head_of_closers'])

@router.get("/nurturers", response_model=List[User])
async def get_nurturing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_nurture_leads' or 'head_of_nurturers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_nurture_leads', 'head_of_nurturers'])

@router.post("/invite", response_model=User)
async def invite_new_user(
    user_in: UserCreate,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Invites a new user to the current tenant. This creates an account in Firebase Auth,
    sets their tenantId and capabilities as custom claims, and creates a user profile in Firestore.
    Requires admin privileges.
    """
    try:
        created_user = await user_service.invite_user(
            tenant_id=auth['tenant_id'],
            user_in=user_in
        )
        return created_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/{user_id}/capabilities", response_model=User)
async def update_user_capabilities(
    user_id: str,
    new_caps: UserUpdateCapabilities,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Updates the capabilities for a specific user within the current tenant.
    Requires admin privileges.
    """
    user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in this tenant.")
    
    await user_service.update_user_capabilities(auth['tenant_id'], user_id, new_caps.capabilities)
    
    updated_user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    return updated_user
@router.get("/closers", response_model=List[User])
async def get_closing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_close_leads' or 'head_of_closers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_close_leads', 'head_of_closers'])

@router.get("/nurturers", response_model=List[User])
async def get_nurturing_agents(
    auth: dict = Depends(get_current_user),
    user_service: UserService = Depends()
):
    """
    Retrieves a list of all users with the 'can_nurture_leads' or 'head_of_nurturers' capability for the current tenant.
    """
    return await user_service.get_users_with_capabilities(auth['tenant_id'], ['can_nurture_leads', 'head_of_nurturers'])

@router.post("/invite", response_model=User)
async def invite_new_user(
    user_in: UserCreate,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Invites a new user to the current tenant. This creates an account in Firebase Auth,
    sets their tenantId and capabilities as custom claims, and creates a user profile in Firestore.
    Requires admin privileges.
    """
    try:
        created_user = await user_service.invite_user(
            tenant_id=auth['tenant_id'],
            user_in=user_in
        )
        return created_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/{user_id}/capabilities", response_model=User)
async def update_user_capabilities(
    user_id: str,
    new_caps: UserUpdateCapabilities,
    auth: dict = Depends(get_admin_user),
    user_service: UserService = Depends()
):
    """
    Updates the capabilities for a specific user within the current tenant.
    Requires admin privileges.
    """
    user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in this tenant.")
    
    await user_service.update_user_capabilities(auth['tenant_id'], user_id, new_caps.capabilities)
    
    updated_user = await user_service.get_user_by_id(auth['tenant_id'], user_id)
    return updated_user

@router.post("/{user_id}/claims", status_code=status.HTTP_200_OK)
def set_custom_claims(
    user_id: str,
    claims: Dict[str, Any],
    auth_info: dict = Depends(get_admin_user)
):
    """Set custom claims for a user. (Admin only)"""
    try:
        auth.set_custom_user_claims(user_id, claims)
        return {"message": f"Custom claims set for user {user_id}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

