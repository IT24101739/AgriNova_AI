"""
AgriShield — FastAPI Application Entry Point

Startup sequence:
  1. Load AI models (disease classifier) — once, at lifespan start
  2. Mount CORS middleware
  3. Include routers:
     - Feature Slice 1 (Member 1): Farmer crop image upload & classification
     - Feature Slice 2 (Member 2): Smart diagnosis, weather, outbreak, advisory

Run with: uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import reports
from app.routers.analysis import router as analysis_router
from app.routers.weather import router as weather_router
from app.routers.additional_image import router as additional_image_router
from app.ai.disease_classifier import get_classifier

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan: load AI models on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy resources (AI models) once on startup."""
    # Clear settings cache so .env is always fresh on restart
    get_settings.cache_clear()
    logger.info("🌱 AgriShield backend starting up...")
    try:
        classifier = get_classifier()
        classifier.load()
    except Exception as e:
        logger.error(f"AI model load failed at startup: {e}")
        # Do not crash server — classifier will raise per-request if needed
    logger.info("✅ Startup complete. Server ready.")
    yield
    logger.info("AgriShield backend shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AgriShield / CropGuard AI API",
    description="Crop disease early-warning platform: Image Diagnosis, Weather Check, Regional Outbreaks & Advisory",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS — allow frontend origins
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        getattr(settings, "frontend_url", "http://localhost:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

# Member 1 routers
app.include_router(reports.router)

# Member 2 routers
app.include_router(analysis_router)
app.include_router(weather_router)
app.include_router(additional_image_router)


# ---------------------------------------------------------------------------
# Health & Root check
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AgriShield / CropGuard AI API",
        "slices": ["Feature Slice 1: Image Diagnosis", "Feature Slice 2: Advisory Engine"]
    }


@app.get("/health", tags=["health"])
def health():
    """Simple health check endpoint."""
    classifier = get_classifier()
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "ai_classifier_loaded": classifier.is_loaded,
            "dev_mode": classifier._dev_mode,
        },
        "message": "",
    }
