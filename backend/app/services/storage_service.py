"""
Supabase Storage service.
Handles image upload to the 'crop-images' bucket.
"""

import logging
import uuid
import os
from typing import Optional

logger = logging.getLogger(__name__)


def upload_image(file_bytes: bytes, original_filename: str) -> str:
    """
    Upload image bytes to Supabase Storage.

    Args:
        file_bytes: Raw image bytes.
        original_filename: Original filename (used to derive extension).

    Returns:
        Public URL of the uploaded image.

    Raises:
        RuntimeError: If upload fails.
    """
    from supabase import create_client
    from app.config import get_settings

    settings = get_settings()

    # Build a unique storage path
    ext = _get_extension(original_filename)
    storage_path = f"reports/{uuid.uuid4()}{ext}"

    try:
        key = settings.supabase_service_key or settings.supabase_key
        client = create_client(settings.supabase_url, key)
        bucket = client.storage.from_(settings.storage_bucket)

        # Upload file
        bucket.upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": _mime_type(ext)},
        )

        # Get public URL
        public_url = bucket.get_public_url(storage_path)
        logger.info(f"Image uploaded to storage: {public_url}")
        return public_url

    except Exception as e:
        logger.warning(f"Supabase storage upload failed ({e}). Generating inline image data URL.", exc_info=True)
        import base64
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        mime = _mime_type(ext)
        return f"data:{mime};base64,{b64}"


def _get_extension(filename: str) -> str:
    """Extract file extension, default to .jpg."""
    _, ext = os.path.splitext(filename)
    return ext.lower() if ext else ".jpg"


def _mime_type(ext: str) -> str:
    """Map extension to MIME type."""
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return mime_map.get(ext, "image/jpeg")
