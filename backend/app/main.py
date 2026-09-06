from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import auth, reports, analysis, sif_intelligence, feedback, dashboard
from .seed_data import seed_sample_data
from . import models

# Create DB Tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered SIF Precursor Detection & Safety Intelligence for Smart India Hackathon PS 165",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(analysis.router)
app.include_router(sif_intelligence.router)
app.include_router(feedback.router)
app.include_router(dashboard.router)

@app.on_event("startup")
def startup_event():
    seed_sample_data()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "api_docs": "/docs"
    }
