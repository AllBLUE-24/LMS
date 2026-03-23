# FILE: backend/app/services/lead_service.py

import pandas as pd
import io
from collections import Counter
from fastapi import Depends, HTTPException, status
from typing import List, Dict, Any
from google.cloud import firestore
from google.cloud.firestore_v1.transaction import Transaction
from pydantic import ValidationError

from app.repository.lead_repository import LeadRepository, get_lead_repository
from app.repository.user_repository import UserRepository, get_user_repository
from app.repository.statistics_repository import StatisticsRepository, get_statistics_repository
from app.repository.user_lead_summary_repository import UserLeadSummaryRepository, get_user_lead_summary_repository # Corrected import
from app.services.notification_service import NotificationService
from app.services.activity_service import ActivityService
from app.services.statistics_service import StatisticsService
from app.schemas.lead import LeadImportInternal, LeadAssignmentUpdate, ScheduleFollowUpRequest
from app.schemas.notification import NotificationCreate
from app.schemas.user_lead_summary import LeadSummary

class LeadService:
    def __init__(
        self,
        lead_repo: LeadRepository = Depends(get_lead_repository),
        user_repo: UserRepository = Depends(get_user_repository),
        stats_repo: StatisticsRepository = Depends(get_statistics_repository),
        summary_repo: UserLeadSummaryRepository = Depends(get_user_lead_summary_repository),
        notification_service: NotificationService = Depends(),
        activity_service: ActivityService = Depends(),
        statistics_service: StatisticsService = Depends()
    ):
        self.lead_repo = lead_repo
        self.user_repo = user_repo
        self.stats_repo = stats_repo
        self.summary_repo = summary_repo
        self.notification_service = notification_service
        self.activity_service = activity_service
        self.statistics_service = statistics_service

    def _update_lead_summary_in_transaction(
        self,
        transaction: Transaction,
        tenant_id: str,
        lead_id: str,
        user_id: str,
        operation: str = 'UPDATE' # Can be 'ADD', 'UPDATE', or 'REMOVE'
    ):
        """
        Manages a user's lead summary document within a Firestore transaction.
        This is the core of the denormalization logic.
        """
        lead_doc_ref = self.lead_repo.get_ref(tenant_id, lead_id)
        lead_snapshot = lead_doc_ref.get(transaction=transaction)

        if not lead_snapshot.exists:
            return

        lead_data = lead_snapshot.to_dict()
        
        lead_summary = LeadSummary(
            id=lead_id,
            name=lead_data.get("name", "N/A"),
            status=lead_data.get("status", "N/A"),
            next_call_date=lead_data.get("next_call_date")
        )
        
        summary_doc_ref = self.summary_repo._get_ref(user_id)
        
        self.summary_repo._update_summary_in_transaction(
            transaction=transaction,
            summary_ref=summary_doc_ref,
            lead_summary_data=lead_summary.model_dump(),
            operation=operation
        )

    def assign_to_nurturer(self, tenant_id: str, lead_ids: List[str], nurturer_id: str, assigner_user: dict) -> dict:
        """Assigns a batch of leads to a Nurturer using a transaction for each lead."""
        nurturer_profile = self.user_repo.get_by_id(tenant_id, nurturer_id)
        if not nurturer_profile:
            raise ValueError(f"Nurturer with ID '{nurturer_id}' not found.")

        assigned_count = 0
        for lead_id in lead_ids:
            try:
                transaction = self.lead_repo.db.transaction()
                
                @firestore.transactional
                def assign_in_transaction(transaction, lead_id):
                    # === READS FIRST ===
                    lead_ref = self.lead_repo.get_ref(tenant_id, lead_id)
                    lead_snapshot = lead_ref.get(transaction=transaction)
                    if not lead_snapshot.exists:
                        return False

                    summary_ref = self.summary_repo._get_ref(nurturer_id)
                    summary_snapshot = summary_ref.get(transaction=transaction)

                    # === WRITES SECOND ===
                    # 1. Update Lead
                    update_payload = {"assignedNurturer": nurturer_id, "status": "Assigned", "lastUpdated": firestore.SERVER_TIMESTAMP}
                    transaction.update(lead_ref, update_payload)
                    
                    # 2. Update Summary
                    lead_summary = LeadSummary(
                        id=lead_id, name=lead_snapshot.to_dict().get("name", "N/A"), status="Assigned",
                        next_call_date=lead_snapshot.to_dict().get("next_call_date")
                    ).model_dump()

                    if not summary_snapshot.exists:
                        transaction.set(summary_ref, {'leads': [lead_summary]})
                    else:
                        leads = summary_snapshot.to_dict().get('leads', [])
                        leads.append(lead_summary)
                        transaction.update(summary_ref, {'leads': leads})
                    
                    return True

                if assign_in_transaction(transaction, lead_id):
                    self.activity_service.create_activity(
                        tenant_id=tenant_id, lead_id=lead_id, user_id=assigner_user['uid'],
                        activity_type="assignment_to_nurturer", data={"assigned_to": nurturer_id}
                    )
                    assigned_count += 1
            except Exception as e:
                print(f"Failed to assign lead {lead_id}: {e}")
                continue

        if assigned_count > 0:
            self.notification_service.create_notification(
                tenant_id,
                NotificationCreate(user_id=nurturer_id, message=f"You have been assigned {assigned_count} new lead(s).")
            )
            self.statistics_service.update_user_dashboard_statistics(tenant_id, nurturer_id)
        return {"status": "success", "message": f"Successfully assigned {assigned_count} leads.", "assigned_count": assigned_count}

    async def assign_to_closer(self, tenant_id: str, lead_id: str, closer_id: str, nurturer_user: dict) -> dict:
        """Assigns a qualified lead from a Nurturer to a Closer within a single transaction."""
        closer_profile = await self.user_repo.get_by_id(tenant_id, closer_id)
        if not closer_profile:
            raise ValueError(f"Closer with ID '{closer_id}' not found.")

        transaction = self.lead_repo.db.transaction()

        @firestore.transactional
        def assign_and_transfer_summary(transaction):
            # === READS FIRST ===
            lead_ref = self.lead_repo.get_ref(tenant_id, lead_id)
            lead_snapshot = lead_ref.get(transaction=transaction)
            if not lead_snapshot.exists: raise ValueError("Lead not found.")
            lead_data = lead_snapshot.to_dict()
            if lead_data.get('status') != 'Interested': raise ValueError("Lead must be in 'Interested' status.")

            nurturer_summary_ref = self.summary_repo._get_ref(nurturer_user['uid'])
            nurturer_summary_snapshot = nurturer_summary_ref.get(transaction=transaction)

            closer_summary_ref = self.summary_repo._get_ref(closer_id)
            closer_summary_snapshot = closer_summary_ref.get(transaction=transaction)

            # === WRITES SECOND ===
            # 1. Update Lead
            update_payload = {"assignedAgent": closer_id, "status": "Ready for Closing", "lastUpdated": firestore.SERVER_TIMESTAMP}
            transaction.update(lead_ref, update_payload)

            # 2. Remove from Nurturer's Summary
            if nurturer_summary_snapshot.exists:
                nurturer_leads = nurturer_summary_snapshot.to_dict().get('leads', [])
                nurturer_leads_updated = [l for l in nurturer_leads if l.get('id') != lead_id]
                transaction.update(nurturer_summary_ref, {'leads': nurturer_leads_updated})

            # 3. Add to Closer's Summary
            closer_summary = LeadSummary(
                id=lead_id, name=lead_data.get("name", "N/A"), status="Ready for Closing",
                next_call_date=lead_data.get("next_call_date")
            ).model_dump()
            if not closer_summary_snapshot.exists:
                transaction.set(closer_summary_ref, {'leads': [closer_summary]})
            else:
                closer_leads = closer_summary_snapshot.to_dict().get('leads', [])
                closer_leads.append(closer_summary)
                transaction.update(closer_summary_ref, {'leads': closer_leads})

        assign_and_transfer_summary(transaction)

        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=nurturer_user['uid'],
            activity_type="assignment_to_closer", data={"assigned_to": closer_id}
        )
        await self.notification_service.create_notification(
            tenant_id, NotificationCreate(user_id=closer_id, message=f"A new interested lead is ready for you.")
        )
        await self.statistics_service.update_user_dashboard_statistics(tenant_id, closer_id)
        await self.statistics_service.update_user_dashboard_statistics(tenant_id, nurturer_user['uid'])
        return {"status": "success", "message": "Lead assigned to closer successfully."}

    async def update_lead_status(self, tenant_id: str, lead_id: str, status: str, user: dict) -> dict:
        """Updates a lead's status and its summary document within a transaction."""
        transaction = self.lead_repo.db.transaction()

        @firestore.transactional
        def update_status_in_transaction(transaction):
            # === READS FIRST ===
            lead_ref = self.lead_repo.get_ref(tenant_id, lead_id)
            lead_snapshot = lead_ref.get(transaction=transaction)
            if not lead_snapshot.exists: raise ValueError("Lead not found.")
            lead_data = lead_snapshot.to_dict()
            
            assigned_user_id = lead_data.get("assignedNurturer") or lead_data.get("assignedAgent")
            summary_snapshot = None
            summary_ref = None
            if assigned_user_id:
                summary_ref = self.summary_repo._get_ref(assigned_user_id)
                summary_snapshot = summary_ref.get(transaction=transaction)

            # === WRITES SECOND ===
            # 1. Update Lead
            transaction.update(lead_ref, {"status": status, "lastUpdated": firestore.SERVER_TIMESTAMP})

            # 2. Update Summary
            if assigned_user_id and summary_snapshot is not None:
                lead_summary_data = LeadSummary(
                    id=lead_id, name=lead_data.get("name", "N/A"), status=status,
                    next_call_date=lead_data.get("next_call_date")
                ).model_dump()

                if not summary_snapshot.exists:
                    transaction.set(summary_ref, {'leads': [lead_summary_data]})
                else:
                    leads = summary_snapshot.to_dict().get('leads', [])
                    found = False
                    for i, l in enumerate(leads):
                        if l.get('id') == lead_id:
                            leads[i] = lead_summary_data
                            found = True
                            break
                    if not found: leads.append(lead_summary_data)
                    transaction.update(summary_ref, {'leads': leads})
            
            return lead_data.get("status", "N/A"), assigned_user_id, lead_data.get("name"), lead_data.get("generatorId")

        old_status, assigned_user_id, lead_name, generator_id = update_status_in_transaction(transaction)

        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=user['uid'],
            activity_type="status_change", data={"old_status": old_status, "new_status": status}
        )
        if assigned_user_id:
            await self.notification_service.create_notification(
                tenant_id, NotificationCreate(user_id=assigned_user_id, message=f"Lead '{lead_name}' status updated to {status}.")
            )
            await self.statistics_service.update_user_dashboard_statistics(tenant_id, assigned_user_id)
        return {"status": "success", "message": f"Lead {lead_id} status updated to {status}."}

    async def close_lead(self, tenant_id: str, lead_id: str, user: dict, close_data: "LeadCloseDetailsUpdate") -> dict:
        """Closes a lead and removes it from the user's summary document in a transaction."""
        transaction = self.lead_repo.db.transaction()

        @firestore.transactional
        def close_in_transaction(transaction):
            # === READS FIRST ===
            lead_ref = self.lead_repo.get_ref(tenant_id, lead_id)
            lead_snapshot = lead_ref.get(transaction=transaction)
            if not lead_snapshot.exists: raise ValueError("Lead not found.")
            
            summary_ref = self.summary_repo._get_ref(user['uid'])
            summary_snapshot = summary_ref.get(transaction=transaction)

            # === WRITES SECOND ===
            # 1. Update Lead
            update_payload = close_data.model_dump(exclude_none=True)
            update_payload["status"] = "Closed - Won"
            update_payload["closing_date"] = firestore.SERVER_TIMESTAMP
            update_payload["lastUpdated"] = firestore.SERVER_TIMESTAMP
            transaction.update(lead_ref, update_payload)

            # 2. Remove from Summary
            if summary_snapshot.exists:
                leads = summary_snapshot.to_dict().get('leads', [])
                updated_leads = [l for l in leads if l.get('id') != lead_id]
                transaction.update(summary_ref, {'leads': updated_leads})
            
            return update_payload

        update_payload = close_in_transaction(transaction)

        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=user['uid'],
            activity_type="lead_closed", data=update_payload
        )
        await self.statistics_service.update_user_dashboard_statistics(tenant_id, user['uid'])
        return {"status": "success", "message": f"Lead {lead_id} closed successfully."}

    # FILE: backend/app/services/lead_service.py

import pandas as pd
import io
from collections import Counter
from fastapi import Depends, HTTPException, status
from typing import List, Dict, Any
from google.cloud import firestore
from google.cloud.firestore_v1.transaction import Transaction
from pydantic import ValidationError

from app.repository.lead_repository import LeadRepository, get_lead_repository
from app.repository.user_repository import UserRepository, get_user_repository
from app.repository.statistics_repository import StatisticsRepository, get_statistics_repository
from app.repository.user_lead_summary_repository import UserLeadSummaryRepository, get_user_lead_summary_repository
from app.services.notification_service import NotificationService
from app.services.activity_service import ActivityService
from app.services.statistics_service import StatisticsService
from app.schemas.lead import LeadImportInternal, LeadAssignmentUpdate, ScheduleFollowUpRequest
from app.schemas.notification import NotificationCreate
from app.schemas.user_lead_summary import LeadSummary

class LeadService:
    def __init__(
        self,
        lead_repo: LeadRepository = Depends(get_lead_repository),
        user_repo: UserRepository = Depends(get_user_repository),
        stats_repo: StatisticsRepository = Depends(get_statistics_repository),
        summary_repo: UserLeadSummaryRepository = Depends(get_user_lead_summary_repository),
        notification_service: NotificationService = Depends(),
        activity_service: ActivityService = Depends(),
        statistics_service: StatisticsService = Depends()
    ):
        self.lead_repo = lead_repo
        self.user_repo = user_repo
        self.stats_repo = stats_repo
        self.summary_repo = summary_repo
        self.notification_service = notification_service
        self.activity_service = activity_service
        self.statistics_service = statistics_service

    async def assign_to_nurturer(self, tenant_id: str, lead_ids: List[str], nurturer_id: str, assigner_user: dict) -> dict:
        nurturer_profile = await self.user_repo.get_by_id(tenant_id, nurturer_id)
        if not nurturer_profile:
            raise ValueError(f"Nurturer with ID '{nurturer_id}' not found.")

        assigned_count = 0
        for lead_id in lead_ids:
            try:
                transaction = self.lead_repo.db.transaction()
                
                @firestore.transactional
                async def assign_in_transaction(transaction, lead_id):
                    lead_ref = self.lead_repo.get_ref(tenant_id, lead_id)
                    lead_snapshot = await lead_ref.get(transaction=transaction)
                    if not lead_snapshot.exists:
                        return False

                    summary_ref = self.summary_repo._get_ref(nurturer_id)
                    summary_snapshot = await summary_ref.get(transaction=transaction)

                    update_payload = {"assignedNurturer": nurturer_id, "status": "Assigned", "lastUpdated": firestore.SERVER_TIMESTAMP}
                    transaction.update(lead_ref, update_payload)
                    
                    lead_summary = LeadSummary(
                        id=lead_id, name=lead_snapshot.to_dict().get("name", "N/A"), status="Assigned",
                        next_call_date=lead_snapshot.to_dict().get("next_call_date")
                    ).model_dump()

                    if not summary_snapshot.exists:
                        transaction.set(summary_ref, {'leads': [lead_summary]})
                    else:
                        leads = summary_snapshot.to_dict().get('leads', [])
                        leads.append(lead_summary)
                        transaction.update(summary_ref, {'leads': leads})
                    
                    return True

                if await assign_in_transaction(transaction, lead_id):
                    await self.activity_service.create_activity(
                        tenant_id=tenant_id, lead_id=lead_id, user_id=assigner_user['uid'],
                        activity_type="assignment_to_nurturer", data={"assigned_to": nurturer_id}
                    )
                    assigned_count += 1
            except Exception as e:
                print(f"Failed to assign lead {lead_id}: {e}")
                continue

        if assigned_count > 0:
            await self.notification_service.create_notification(
                tenant_id,
                NotificationCreate(user_id=nurturer_id, message=f"You have been assigned {assigned_count} new lead(s).")
            )
            await self.statistics_service.update_user_dashboard_statistics(tenant_id, nurturer_id)
        return {"status": "success", "message": f"Successfully assigned {assigned_count} leads.", "assigned_count": assigned_count}

    async def get_nurturing_queue(self, tenant_id: str, user: dict) -> List[Dict[str, Any]]:
        if 'head_of_nurturers' in user['capabilities']:
            docs_stream = self.lead_repo.get_all_nurturing_leads(tenant_id)
            queue = []
            async for doc in docs_stream:
                lead_data = doc.to_dict()
                lead_data['id'] = doc.id
                queue.append(lead_data)
            return queue

        summary_doc = await self.summary_repo.get(user['uid'])
        if not summary_doc or not summary_doc.leads:
            return []

        lead_ids = [summary.id for summary in summary_doc.leads]
        
        full_leads = await self.lead_repo.get_by_ids(tenant_id, lead_ids)
        return full_leads

    async def get_assigned_leads(self, tenant_id: str, user: dict, filter_status: str | None, limit: int, start_after_doc: Any) -> dict:
        if 'head_of_closers' in user['capabilities']:
            docs_stream = self.lead_repo.get_all_assigned_leads(tenant_id, filter_status, start_after_doc, limit)
            leads = []
            last_doc_id = None
            async for doc in docs_stream:
                lead_data = doc.to_dict()
                lead_data['id'] = doc.id
                leads.append(lead_data)
                last_doc_id = doc.id
            next_page_cursor = last_doc_id if len(leads) == limit else None
            return {"leads": leads, "nextPageCursor": next_page_cursor}

        summary_doc = await self.summary_repo.get(user['uid'])
        if not summary_doc or not summary_doc.leads:
            return {"leads": [], "nextPageCursor": None}

        summaries = summary_doc.leads
        if filter_status:
            summaries = [s for s in summaries if s.status == filter_status]
        
        lead_ids = [summary.id for summary in summaries]
        
        if not lead_ids:
            return {"leads": [], "nextPageCursor": None}

        full_leads = await self.lead_repo.get_by_ids(tenant_id, lead_ids[:limit])

        return {"leads": full_leads, "nextPageCursor": None}

    async def bulk_upload_leads(self, tenant_id: str, file_contents: bytes, file_type: str, column_mapping: dict, current_user: dict) -> dict:
        try:
            if file_type == 'text/csv':
                df = pd.read_csv(io.BytesIO(file_contents))
            elif file_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                df = pd.read_excel(io.BytesIO(file_contents))
            else:
                raise ValueError("Unsupported file type.")

            df.rename(columns=column_mapping, inplace=True)
            if 'email' not in df.columns or 'name' not in df.columns:
                raise ValueError("File must contain at least 'email' and 'name' columns.")

            upload_emails = df['email'].dropna().unique().tolist()
            existing_leads_docs = self.lead_repo.get_leads_by_emails(tenant_id, upload_emails)
            
            existing_emails = set()
            async for doc in existing_leads_docs:
                existing_emails.add(doc.to_dict()['email'])

            created_count = 0
            skipped_count = 0
            
            for _, row in df.iterrows():
                email = row.get("email")
                if not email or pd.isna(email) or email in existing_emails:
                    if email in existing_emails:
                        skipped_count += 1
                    continue

                try:
                    lead_data_filtered = {k: v for k, v in row.to_dict().items() if v is not None and not pd.isna(v)}
                    lead_to_create = LeadImportInternal(**lead_data_filtered)
                    await self._create_lead_document(tenant_id, lead_to_create, current_user)
                    created_count += 1
                    existing_emails.add(email)
                except (ValidationError, ValueError) as e:
                    print(f"Skipping row due to error: {e}")
                    skipped_count += 1

            if created_count > 0:
                await self.statistics_service.update_dashboard_statistics(tenant_id)
                await self.statistics_service.update_user_dashboard_statistics(tenant_id, current_user['uid'])

            message = f"Successfully imported {created_count} new leads. Skipped {skipped_count} duplicate or invalid rows."
            return {"status": "success", "message": message, "created_count": created_count, "skipped_count": skipped_count}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to process file: {e}")

    async def _create_lead_document(self, tenant_id: str, lead: LeadImportInternal, current_user: dict) -> dict:
        existing_lead_docs = await self.lead_repo.get_by_email(tenant_id, lead.email)
        if len([doc async for doc in existing_lead_docs]) > 0:
            raise ValueError(f"A lead with the email '{lead.email}' already exists in this tenant.")

        lead_data = lead.model_dump(exclude_none=True)
        lead_data['generatorId'] = current_user['uid']
        lead_data['createdAt'] = firestore.SERVER_TIMESTAMP
        lead_data['status'] = 'New'

        new_lead_ref = await self.lead_repo.create(tenant_id, lead_data)
        new_lead_id = new_lead_ref.id
        
        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=new_lead_id, user_id=current_user['uid'],
            activity_type="creation", data={"method": "manual", "creator": current_user['uid']}
        )
        
        return {"lead_id": new_lead_id, "message": "Lead created successfully."}


    async def add_manual_lead(self, tenant_id: str, lead: LeadImportInternal, current_user: dict) -> dict:
        """Public method to add a single lead manually."""
        result = await self._create_lead_document(tenant_id, lead, current_user)
        
        await self.statistics_service.update_dashboard_statistics(tenant_id)
        await self.statistics_service.update_user_dashboard_statistics(tenant_id, current_user['uid'])
        
        return {
            "status": "success",
            "message": result["message"],
            "lead_id": result["lead_id"]
        }

    

    async def qualify_lead(self, tenant_id: str, lead_id: str, user: dict, qualification_data: "LeadQualificationUpdate") -> dict:
        """Qualifies a lead by updating it with detailed information."""
        lead_doc = await self.lead_repo.get_by_id(tenant_id, lead_id)
        if not lead_doc.exists:
            raise ValueError("Lead not found.")

        update_payload = qualification_data.model_dump(exclude_none=True)
        update_payload["status"] = "Interested"
        update_payload["lastUpdated"] = firestore.SERVER_TIMESTAMP
        
        await self.lead_repo.update(tenant_id, lead_id, update_payload)

        activity_data = update_payload.copy()
        if "notes" in activity_data:
            activity_data["note"] = activity_data.pop("notes")

        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=user['uid'],
            activity_type="lead_qualified", data=activity_data
        )

        return {"status": "success", "message": f"Lead {lead_id} qualified successfully."}

    async def get_leads_by_generator(self, tenant_id: str, user: dict, limit: int | None) -> dict:
        """Gets leads created by a specific generator or all generated leads for a head of generators."""
        if 'head_of_generators' in user['capabilities']:
            docs_stream = self.lead_repo.get_all_generated_leads(tenant_id, limit)
        else:
            docs_stream = self.lead_repo.get_leads_by_generator(tenant_id, user['uid'], limit)
        
        generated_leads = []
        async for doc in docs_stream:
            lead_data = doc.to_dict()
            lead_data['id'] = doc.id
            generated_leads.append(lead_data)
            
        return {"leads": generated_leads}

    async def get_lead_by_id(self, tenant_id: str, lead_id: str) -> dict:
        """Retrieves a single lead by its ID."""
        lead_doc = await self.lead_repo.get_by_id(tenant_id, lead_id)
        if not lead_doc.exists:
            return None

        lead_data = lead_doc.to_dict()
        lead_data['id'] = lead_doc.id
        for key, value in lead_data.items():
            if hasattr(value, 'isoformat'):
                lead_data[key] = value.isoformat()
        
        return lead_data
    
    async def schedule_follow_up(self, tenant_id: str, lead_id: str, user_id: str, follow_up_data: "ScheduleFollowUpRequest") -> dict:
        """Schedules a follow-up call for a lead."""
        lead_doc = await self.lead_repo.get_by_id(tenant_id, lead_id)
        if not lead_doc.exists:
            raise ValueError("Lead not found.")

        await self.lead_repo.update(tenant_id, lead_id, {"next_call_date": follow_up_data.next_call_date, "status": "Follow-up"})
        
        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=user_id,
            activity_type="follow_up_scheduled",
            data={"next_call_date": follow_up_data.next_call_date.isoformat(), "reason": follow_up_data.reason, "note": follow_up_data.note}
        )
        
        await self.notification_service.create_notification(
            tenant_id,
            NotificationCreate(user_id=user_id, message=f"Follow-up scheduled for lead '{lead_doc.to_dict()['name']}'.")
        )

        return {"status": "success", "message": "Follow-up scheduled successfully."}

    async def schedule_meeting(self, tenant_id: str, lead_id: str, user_id: str, meeting_data: "ScheduleMeetingRequest") -> dict:
        """Schedules a meeting for a lead."""
        lead_doc = await self.lead_repo.get_by_id(tenant_id, lead_id)
        if not lead_doc.exists:
            raise ValueError("Lead not found.")

        await self.lead_repo.update(tenant_id, lead_id, {"next_meet_date": meeting_data.meetingTime, "status": "Meeting Scheduled"})
        
        await self.activity_service.create_activity(
            tenant_id=tenant_id, lead_id=lead_id, user_id=user_id,
            activity_type="meeting_scheduled",
            data={"next_meet_date": meeting_data.meetingTime.isoformat(), "location": meeting_data.location, "note": meeting_data.notes}
        )

        await self.notification_service.create_notification(
            tenant_id,
            NotificationCreate(user_id=user_id, message=f"Meeting scheduled for lead '{lead_doc.to_dict()['name']}'.")
        )

        return {"status": "success", "message": "Meeting scheduled successfully."}

    async def get_closed_won_leads(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Retrieves all closed-won leads for a specific tenant."""
        docs_stream = self.lead_repo.get_closed_won_leads(tenant_id)
        
        closed_leads = []
        async for doc in docs_stream:
            try:
                lead_data = doc.to_dict()
                lead_data['id'] = doc.id
                for key, value in lead_data.items():
                    if hasattr(value, 'isoformat'):
                        lead_data[key] = value.isoformat()
                closed_leads.append(lead_data)
            except Exception as e:
                print(f"ERROR: Failed to process lead document ID: {doc.id}. Error: {e}")
                continue
            
        return closed_leads

    async def get_admin_dashboard_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Gathers and computes statistics for the admin dashboard."""
        try:
            stats_doc = await self.stats_repo.get_dashboard_stats(tenant_id)
            if not stats_doc.exists:
                return {"kpis": {"totalLeads": 0, "conversionRate": 0}, "pipeline": {}, "leaderboards": {"topGenerators": [], "topClosers": []}}
            
            stats_data = stats_doc.to_dict()
            total_leads = stats_data.get("totalLeads", 0)
            leads_won = stats_data.get("leadsByStatus", {}).get("Closed - Won", 0)
            conversion_rate = (leads_won / total_leads * 100) if total_leads > 0 else 0
            kpis = {"totalLeads": total_leads, "conversionRate": round(conversion_rate, 2)}
            pipeline_counts = stats_data.get("leadsByStatus", {})
            
            all_users = await self.user_repo.get_all(tenant_id)
            users_map = {user['id']: user.get('name', 'Unknown User') for user in all_users}
            
            all_leads_docs = self.lead_repo.get_all_leads(tenant_id)
            leads = [doc.to_dict() async for doc in all_leads_docs]
            generator_ids = [lead.get('generatorId') for lead in leads if lead.get('generatorId')]
            closer_ids = [lead.get('assignedAgent') for lead in leads if lead.get('status') == 'Closed - Won' and lead.get('assignedAgent')]
            top_generators = [{"name": users_map.get(uid, "Unknown"), "count": count} for uid, count in Counter(generator_ids).most_common(5)]
            top_closers = [{"name": users_map.get(uid, "Unknown"), "count": count} for uid, count in Counter(closer_ids).most_common(5)]

            return {"kpis": kpis, "pipeline": dict(pipeline_counts), "leaderboards": {"topGenerators": top_generators, "topClosers": top_closers}}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred while calculating dashboard statistics: {e}")
