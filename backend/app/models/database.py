"""
SQLAlchemy database engine and session factory.
Uses DATABASE_URL from environment (Supabase PostgreSQL).
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

Base = declarative_base()

db_url = settings.database_url or ""
if "YOUR_DB_PASSWORD" in db_url or not db_url.startswith(("postgresql", "sqlite")):
    logger.warning("DATABASE_URL contains placeholder 'YOUR_DB_PASSWORD' or is invalid. Using local SQLite.")
    db_url = "sqlite:///./agrishield.db"


def _create_engine_instance(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
        )
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


try:
    engine = _create_engine_instance(db_url)
    if not db_url.startswith("sqlite"):
        with engine.connect() as conn:
            pass
except Exception as e:
    logger.warning(f"Database connection to {db_url} failed ({e}). Falling back to local SQLite.")
    db_url = "sqlite:///./agrishield.db"
    engine = _create_engine_instance(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Ensure all SQLAlchemy tables (farms, reports, analysis_results) exist."""
    try:
        from app.models import report_model  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables verified and ready ({db_url}).")
    except Exception as exc:
        logger.error(f"Error creating database tables: {exc}")


def get_db():
    """FastAPI dependency — yields a DB session and ensures it closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

