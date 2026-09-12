"""
AgriShield — FastAPI Application Entry Point

Combines all 3 Feature Slices:
  - Feature Slice 1 (Member 1): Farmer crop image upload & classification
  - Feature Slice 2 (Member 2): Smart diagnosis, weather, advisory & severity estimation
  - Feature Slice 3 (Member 3): Officer Dashboard, low-confidence ticket management, map, visits & AI assistant
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.config import get_settings
from app.routers import reports
from app.routers.analysis import router as analysis_router
from app.routers.weather import router as weather_router
from app.routers.additional_image import router as additional_image_router
from app.routers.auth import router as auth_router
from app.routers import officer, shared
from app.ai.disease_classifier import get_classifier

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy resources (AI models) and initialize database on startup."""
    get_settings.cache_clear()
    logger.info("🌱 AgriShield backend starting up...")
    try:
        from app.models.database import init_db
        init_db()
    except Exception as e:
        logger.error(f"Database init failed: {e}")
    try:
        classifier = get_classifier()
        classifier.load()
    except Exception as e:
        logger.error(f"AI model load failed at startup: {e}")
    logger.info("✅ Startup complete. Server ready.")
    yield
    logger.info("AgriShield backend shutting down.")


app = FastAPI(
    title="AgriShield / CropGuard AI API",
    description="Agriculture crop disease early warning system — CodeArena'26 Topic 05",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

frontend_url = os.getenv("FRONTEND_URL", getattr(settings, "frontend_url", "http://localhost:5173"))
origins = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Authentication & Profiles ─────────────────────────────────────────────────
app.include_router(auth_router)

# ── Feature Slice 1 (Member 1) ────────────────────────────────────────────────
app.include_router(reports.router)

# ── Feature Slice 2 (Member 2) ────────────────────────────────────────────────
app.include_router(analysis_router)
app.include_router(weather_router)
app.include_router(additional_image_router)

# ── Feature Slice 3 (Member 3) ────────────────────────────────────────────────
app.include_router(officer.router)
app.include_router(shared.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AgriShield / CropGuard AI API",
        "slices": [
            "Feature Slice 1: Image Diagnosis",
            "Feature Slice 2: Advisory Engine",
            "Feature Slice 3: Officer Dashboard & Outbreak Management"
        ]
    }


@app.get("/health", tags=["health"])
def health():
    classifier = get_classifier()
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "ai_classifier_loaded": classifier.is_loaded,
            "dev_mode": getattr(classifier, "_dev_mode", False),
        },
        "message": "OK",
    }
