# FILE: app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import leads, dashboard, users # Import the new users router

# App Initialization
app = FastAPI(
    title="Lead Management System API",
    description="Backend services for the LMS application.",
    version="1.0.0"
)

# --- CORS Middleware ---
origins = [ "http://localhost:3000" ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include API Routers ---
app.include_router(leads.router, prefix="/api/v1/leads", tags=["Leads"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"]) # Add the new router

@app.get("/")
def read_root():
    """A simple root endpoint to confirm the API is running."""
    return {"message": "Welcome to the LMS FastAPI Backend!"}