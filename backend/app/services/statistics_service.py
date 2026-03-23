from fastapi import Depends
from collections import Counter
from app.repository.lead_repository import LeadRepository, get_lead_repository
from app.repository.statistics_repository import StatisticsRepository, get_statistics_repository
from app.repository.user_lead_summary_repository import UserLeadSummaryRepository, get_user_lead_summary_repository # Corrected import

class StatisticsService:
    def __init__(
        self,
        lead_repo: LeadRepository = Depends(get_lead_repository),
        stats_repo: StatisticsRepository = Depends(get_statistics_repository),
        summary_repo: UserLeadSummaryRepository = Depends(get_user_lead_summary_repository)
    ):
        self.lead_repo = lead_repo
        self.stats_repo = stats_repo
        self.summary_repo = summary_repo

    async def update_dashboard_statistics(self, tenant_id: str):
        """
        Recalculates the main dashboard statistics from scratch.
        """
        all_leads_docs = self.lead_repo.get_all_leads(tenant_id)
        leads = [doc.to_dict() async for doc in all_leads_docs]
        total_leads = len(leads)
        leads_by_status = Counter(lead.get('status', 'Unknown') for lead in leads)
        leads_by_source = Counter(lead.get('source', 'Unknown') for lead in leads)
        
        stats_data = {
            "totalLeads": total_leads,
            "leadsByStatus": dict(leads_by_status),
            "leadsBySource": dict(leads_by_source),
        }
        await self.stats_repo.update_dashboard_stats(tenant_id, stats_data)
        return stats_data

    async def update_user_dashboard_statistics(self, tenant_id: str, user_id: str):
        """
        Calculates and saves dashboard statistics for a single user based on their ASSIGNED leads.
        """
        from datetime import datetime, timedelta, timezone

        # Step 1: Get the list of assigned lead IDs from the summary document.
        summary_doc = await self.summary_repo.get(user_id)
        if not summary_doc or not summary_doc.leads:
            # If the user has no assigned leads, save a zeroed-out stats document.
            await self.stats_repo.update_user_dashboard_stats(tenant_id, user_id, {
                "totalLeadsInPeriod": 0, "leadsToday": 0, "topSource": "N/A",
                "sourceData": [], "leadsTrendData": [], "monthlyTargetActual": 0,
            })
            return

        assigned_lead_ids = [summary.id for summary in summary_doc.leads]

        # Step 2: Fetch the full details for only those leads.
        user_leads = await self.lead_repo.get_by_ids(tenant_id, assigned_lead_ids)

        # Step 3: Perform calculations (same logic as before, but on the correct data).
        now_utc = datetime.now(timezone.utc)
        today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = today_start - timedelta(days=6)
        month_start = today_start.replace(day=1)

        # Note: We are calculating stats based on when the lead was CREATED, not assigned.
        # This is usually the desired behavior for tracking overall lead age and trends.
        leads_this_month = [
            lead for lead in user_leads if lead.get('createdAt') and lead['createdAt'] >= month_start
        ]
        
        leads_by_source = Counter(lead.get('source') for lead in leads_this_month if lead.get('source'))
        
        leads_by_day = Counter()
        for lead in user_leads:
            created_at = lead.get('createdAt')
            if created_at and created_at >= seven_days_ago:
                day_str = created_at.strftime('%b %d')
                leads_by_day[day_str] += 1
        
        trend_data = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            day_str = day.strftime('%b %d')
            trend_data.append({"day": day_str, "leads": leads_by_day.get(day_str, 0)})

        stats_data = {
            "totalLeadsInPeriod": len(leads_this_month),
            "leadsToday": leads_by_day.get(today_start.strftime('%b %d'), 0),
            "topSource": leads_by_source.most_common(1)[0][0] if leads_by_source else "N/A",
            "sourceData": [{"name": name, "value": count} for name, count in leads_by_source.items()],
            "leadsTrendData": trend_data,
            "monthlyTargetActual": len(leads_this_month),
        }

        await self.stats_repo.update_user_dashboard_stats(tenant_id, user_id, stats_data)
        return stats_data

def get_statistics_service(
    lead_repo: LeadRepository = Depends(get_lead_repository),
    stats_repo: StatisticsRepository = Depends(get_statistics_repository),
    summary_repo: UserLeadSummaryRepository = Depends(get_user_lead_summary_repository)
) -> StatisticsService:
    return StatisticsService(lead_repo=lead_repo, stats_repo=stats_repo, summary_repo=summary_repo)
