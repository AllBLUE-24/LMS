# app/api/v1/dashboard.py
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.v1.dependencies import get_current_user
from app.repository.statistics_repository import StatisticsRepository, get_statistics_repository
from app.repository.lead_repository import LeadRepository, get_lead_repository
from app.repository.user_lead_summary_repository import UserLeadSummaryRepository, get_user_lead_summary_repository
from datetime import date

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    # NOTE: Real-time date filtering on the dashboard has been temporarily removed 
    # to ensure the correct pre-calculated data is always shown.
    # from_date: date = Query(None, alias="from"),
    # to_date: date = Query(None, alias="to"),
    auth: dict = Depends(get_current_user),
    stats_repo: StatisticsRepository = Depends(get_statistics_repository),
    lead_repo: LeadRepository = Depends(get_lead_repository),
    summary_repo: UserLeadSummaryRepository = Depends(get_user_lead_summary_repository)
):
    """
    Retrieves pre-calculated dashboard statistics for the logged-in user.
    This endpoint directly reads from the statistics documents for maximum performance.
    """
    try:
        tenant_id = auth['tenant_id']
        user_id = auth['uid']

        # --- Fetch Pre-Calculated Statistics ---
        user_stats_doc = await stats_repo.get_user_dashboard_stats(tenant_id, user_id)
        user_stats = user_stats_doc.to_dict() if user_stats_doc.exists else {}

        team_stats_doc = await stats_repo.get_dashboard_stats(tenant_id)
        team_stats = team_stats_doc.to_dict() if team_stats_doc.exists else {}

        # --- Fetch Recent Leads from the User's Summary ---
        recent_leads = []
        summary_doc = await summary_repo.get(user_id)
        if summary_doc and summary_doc.leads:
            # Get the IDs of the most recent 5 leads from the summary
            recent_lead_ids = [summary.id for summary in summary_doc.leads[:5]]
            if recent_lead_ids:
                # Fetch the full details for just those leads
                recent_leads = await lead_repo.get_by_ids(tenant_id, recent_lead_ids)

        # --- Assemble and Return the Response ---
        return {
            "userStats": {
                "totalLeadsInPeriod": user_stats.get("totalLeadsInPeriod", 0),
                "leadsToday": user_stats.get("leadsToday", 0),
                "topSource": user_stats.get("topSource", "N/A"),
                "sourceData": user_stats.get("sourceData", []),
                "leadsTrendData": user_stats.get("leadsTrendData", []),
                "monthlyTargetActual": user_stats.get("monthlyTargetActual", 0),
            },
            "teamStats": {
                "totalLeadsInPeriod": team_stats.get("totalLeads", 0),
                "topSource": "N/A", # This would require a more complex aggregation
                "sourceData": [],
            },
            "recentLeads": recent_leads,
        }
    except Exception as e:
        print(f"An error occurred while fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard statistics: {e}")
