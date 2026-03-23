from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any
from app.schemas.activity import Activity, ActivityCreate
from app.services.activity_service import ActivityService
from app.api.v1.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Activity], summary="Get activities for a lead")
async def get_activities(
    lead_id: str = Query(..., description="The ID of the lead to fetch activities for."),
    auth: dict = Depends(get_current_user),
    service: ActivityService = Depends()
):
    """Retrieves all activities for a specific lead within the user's tenant."""
    return await service.get_activities_for_lead(auth['tenant_id'], lead_id)

@router.post("/", response_model=Activity, status_code=status.HTTP_201_CREATED, summary="Create a new activity")
async def create_activity(
    activity_data: ActivityCreate,
    auth: dict = Depends(get_current_user),
    service: ActivityService = Depends()
):
    """Adds a new activity to a lead within the user's tenant."""
    return await service.create_activity(
        tenant_id=auth['tenant_id'],
        lead_id=activity_data.lead_id,
        user_id=auth['uid'],
        activity_type=activity_data.activity_type,
        data=activity_data.data
    )

@router.put("/{activity_id}", response_model=Activity, summary="Update an activity")
async def update_activity(
    activity_id: str,
    activity_data: Dict[str, Any],
    auth: dict = Depends(get_current_user),
    service: ActivityService = Depends()
):
    """Updates an existing activity."""
    try:
        return await service.update_activity(
            tenant_id=auth['tenant_id'],
            activity_id=activity_id,
            update_data=activity_data,
            user_id=auth['uid']
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an activity")
async def delete_activity(
    activity_id: str,
    auth: dict = Depends(get_current_user),
    service: ActivityService = Depends()
):
    """Deletes an activity."""
    try:
        await service.delete_activity(
            tenant_id=auth['tenant_id'],
            activity_id=activity_id,
            user_id=auth['uid']
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))