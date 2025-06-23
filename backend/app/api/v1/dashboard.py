# app/api/v1/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from collections import Counter
from datetime import datetime, timedelta

from app.db.firestore import get_db

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: Client = Depends(get_db)):
    """
    Calculates and returns key statistics for the Lead Generator dashboard.
    """
    try:
        leads_ref = db.collection('leads')
        all_leads_stream = leads_ref.stream()

        # --- Data Aggregation ---
        leads_by_source = Counter()
        leads_by_location = Counter()
        total_leads = 0
        leads_today = 0
        
        # Get the start of today for comparison
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        for lead_doc in all_leads_stream:
            total_leads += 1
            lead_data = lead_doc.to_dict()

            # Increment source counter
            if source := lead_data.get('source'):
                leads_by_source[source] += 1
            
            # Increment location counter
            if location := lead_data.get('location'):
                leads_by_location[location] += 1

            # Check if lead was created today
            if creation_date := lead_data.get('creationDate'):
                 # Assuming creationDate is a Firestore timestamp
                 if creation_date.replace(tzinfo=None) >= today_start:
                     leads_today += 1

        # Format the data for recharts
        # e.g., [{"name": "Website", "value": 400}, ...]
        formatted_source_data = [{"name": name, "value": count} for name, count in leads_by_source.items()]
        formatted_location_data = [{"name": name, "leads": count} for name, count in leads_by_location.items()]

        return {
            "totalLeads": total_leads,
            "leadsToday": leads_today,
            "topSource": leads_by_source.most_common(1)[0][0] if leads_by_source else "N/A",
            "leadsBySource": formatted_source_data,
            "leadsByLocation": formatted_location_data,
            # Placeholder for now, can be developed further
            "leadTrend": [ 
                { "day": 'Mon', "leads": 4 }, { "day": 'Tue', "leads": 6 },
                { "day": 'Wed', "leads": 5 }, { "day": 'Thu', "leads": 8 },
                { "day": 'Fri', "leads": 7 }, { "day": 'Sat', "leads": 10 },
                { "day": 'Sun', "leads": leads_today },
            ]
        }

    except Exception as e:
        print(f"An error occurred while fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate dashboard statistics.")

