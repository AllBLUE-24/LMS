# backend/app/api/v1/router.py
"""
Centralized router registry for the core API services.
"""
from fastapi import APIRouter
from app.api.v1 import (
    activities,
    chat,
    dashboard,
    leads,
    notifications,
    tasks,
    users
)

# Create a single, consolidated router for the v1 API
api_v1_router = APIRouter()

# Include each feature router with its specific prefix
api_v1_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_v1_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_v1_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_v1_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_v1_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])