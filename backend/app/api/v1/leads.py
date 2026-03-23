# FILE: backend/app/api/v1/leads.py

import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status, Response, Query

from app.api.v1.dependencies import get_current_user, get_admin_user, get_nurturer_user, get_closing_agent_user, get_generator_user
from app.schemas.lead import Lead, LeadImportInternal, LeadAssignmentUpdate, LeadStatusUpdate, BulkLeadAssignmentUpdate, ScheduleFollowUpRequest, LeadQualificationUpdate, ScheduleMeetingRequest, LeadCloseDetailsUpdate
from app.services.lead_service import LeadService


logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/bulk-assign", summary="[GENERATOR] Assign multiple leads to a nurturer")
async def bulk_assign_leads_to_nurturer(
    assignment: BulkLeadAssignmentUpdate,
    auth: dict = Depends(get_generator_user),
    lead_service: LeadService = Depends()
):
    try:
        result = await lead_service.assign_to_nurturer(
            tenant_id=auth['tenant_id'],
            lead_ids=assignment.leadIds,
            nurturer_id=assignment.agentId,
            assigner_user=auth
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error during bulk assignment to nurturer: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.post("/{lead_id}/assign-to-closer", summary="[NURTURER] Assign an interested lead to a closer")
async def assign_lead_to_closer(
    lead_id: str,
    assignment: LeadAssignmentUpdate,
    auth: dict = Depends(get_nurturer_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.assign_to_closer(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            closer_id=assignment.agentId,
            nurturer_user=auth
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning lead to closer: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.post("/add-manual", status_code=status.HTTP_201_CREATED, summary="Add a single lead manually")
async def add_lead_manually(
    lead: LeadImportInternal,
    auth: dict = Depends(get_current_user),
    lead_service: LeadService = Depends()
):
    try:
        result = await lead_service.add_manual_lead(auth['tenant_id'], lead, auth)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding lead manually: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.get("/my-leads", summary="[CLOSER] Get leads assigned to the current closer")
async def get_my_assigned_leads(
    auth: dict = Depends(get_closing_agent_user),
    lead_service: LeadService = Depends(),
    filter_status: str | None = Query(None, alias="status"),
    limit: int = Query(25, gt=0, le=100),
    start_after_id: str | None = Query(None, alias="startAfter")
):
    start_after_doc = None
    return await lead_service.get_assigned_leads(
        tenant_id=auth['tenant_id'],
        user=auth,
        filter_status=filter_status,
        limit=limit,
        start_after_doc=start_after_doc
    )

@router.post("/upload-file", summary="Bulk upload leads from a file")
async def upload_leads_file(
    mapping: str = Form(...),
    file: UploadFile = File(...),
    auth: dict = Depends(get_current_user),
    lead_service: LeadService = Depends()
):
    try:
        contents = await file.read()
        column_mapping = json.loads(mapping)
        result = await lead_service.bulk_upload_leads(
            tenant_id=auth['tenant_id'],
            file_contents=contents,
            file_type=file.content_type,
            column_mapping=column_mapping,
            current_user=auth
        )
        return result
    except Exception as e:
        logger.error(f"Error during file upload: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred during file upload: {e}")

@router.put("/{lead_id}/status", summary="Update a lead's status")
async def update_lead_status(
    lead_id: str,
    status_update: LeadStatusUpdate,
    auth: dict = Depends(get_current_user),
    lead_service: LeadService = Depends()
):
    try:
        result = await lead_service.update_lead_status(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            status=status_update.status,
            user=auth
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{lead_id}/qualify", summary="[NURTURER] Qualify a lead")
async def qualify_lead(
    lead_id: str,
    qualification_data: LeadQualificationUpdate,
    auth: dict = Depends(get_nurturer_user),
    lead_service: LeadService = Depends()
):
    try:
        result = await lead_service.qualify_lead(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            user=auth,
            qualification_data=qualification_data
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/generated-leads", summary="[GENERATOR] Get leads created by the current generator")
async def get_my_generated_leads(
    auth: dict = Depends(get_generator_user),
    lead_service: LeadService = Depends(),
    limit: int = Query(None, gt=0, le=1000)
):
    return await lead_service.get_leads_by_generator(
        tenant_id=auth['tenant_id'],
        user=auth,
        limit=limit
    )

@router.get("/admin/dashboard-stats", summary="[ADMIN] Get all statistics for the main dashboard")
async def get_admin_dashboard_stats(
    auth: dict = Depends(get_admin_user),
    lead_service: LeadService = Depends()
):
    return await lead_service.get_admin_dashboard_stats(auth['tenant_id'])

@router.get("/nurturing-queue", summary="[NURTURER] Get the lead nurturing queue", response_model=List[Lead])
async def get_nurturing_queue(
    auth: dict = Depends(get_nurturer_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.get_nurturing_queue(auth['tenant_id'], auth)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching the nurturing queue: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected server error occurred.")

@router.get("/closed-won", summary="[ADMIN] Get all closed-won leads", response_model=List[Lead])
async def get_closed_won_leads(
    auth: dict = Depends(get_admin_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.get_closed_won_leads(auth['tenant_id'])
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching closed-won leads: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected server error occurred.")

@router.get("/{lead_id}", summary="Get a single lead by its ID")
async def get_lead_by_id(
    lead_id: str,
    auth: dict = Depends(get_current_user),
    lead_service: LeadService = Depends()
):
    try:
        lead = await lead_service.get_lead_by_id(auth['tenant_id'], lead_id)
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        return lead
    except Exception as e:
        logger.error(f"Error retrieving lead {lead_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.post("/{lead_id}/schedule-follow-up", summary="[NURTURER] Schedule a follow-up call")
async def schedule_follow_up(
    lead_id: str,
    follow_up_request: ScheduleFollowUpRequest,
    auth: dict = Depends(get_nurturer_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.schedule_follow_up(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            user_id=auth['uid'],
            follow_up_data=follow_up_request
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{lead_id}/schedule-meeting", summary="[CLOSER] Schedule a meeting")
async def schedule_meeting(
    lead_id: str,
    meeting_request: ScheduleMeetingRequest,
    auth: dict = Depends(get_closing_agent_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.schedule_meeting(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            user_id=auth['uid'],
            meeting_data=meeting_request
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{lead_id}/close", summary="[CLOSER] Close a lead")
async def close_lead(
    lead_id: str,
    close_data: LeadCloseDetailsUpdate,
    auth: dict = Depends(get_closing_agent_user),
    lead_service: LeadService = Depends()
):
    try:
        return await lead_service.close_lead(
            tenant_id=auth['tenant_id'],
            lead_id=lead_id,
            user=auth,
            close_data=close_data
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


