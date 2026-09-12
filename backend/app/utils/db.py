import os
from functools import lru_cache
from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return a cached Supabase client.  Reads credentials from env vars."""
    url = os.environ["SUPABASE_URL"]
    # Prefer service-role key for backend; fall back to anon key
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_KEY"]
    return create_client(url, key)
