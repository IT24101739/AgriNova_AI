"""
AgriShield — FastAPI Application Entry Point

Startup sequence:
  1. Load AI models (disease classifier) — once, at lifespan start
  2. Mount CORS middleware
  3. Include routers

Run with: uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import reports
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
    title="AgriShield API",
    description="Crop disease early-warning platform — Feature Slice 1: Farmer Reporting",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS — allow frontend origin
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(reports.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

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
