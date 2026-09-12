"""
SQLAlchemy database engine and session factory.
Uses DATABASE_URL from environment (Supabase PostgreSQL).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # verify connection health before using from pool
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and ensures it closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
