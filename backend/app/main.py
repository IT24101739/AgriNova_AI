"""AgriShield FastAPI application entry point."""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.routers import officer, shared  # noqa: E402

app = FastAPI(
    title="AgriShield API",
    description="Agriculture crop disease early warning system — CodeArena'26 Topic 05",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(officer.router)
app.include_router(shared.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "AgriShield API"}


@app.get("/")
def root():
    return {
        "service": "AgriShield API",
        "docs": "/docs",
        "version": "1.0.0",
    }
