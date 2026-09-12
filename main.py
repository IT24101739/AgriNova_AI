"""
Root application entry point for Render / Cloud hosting.
Allows running from root via `uvicorn main:app` or `uvicorn backend.app.main:app`.
"""
import os
import sys

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app  # noqa: F401
