"""
auth.py — Authentication router for AgriNova AI.

Handles:
  - POST /api/auth/signup  (Create confirmed user in Supabase Auth + database)
  - POST /api/auth/login   (Sign in with Supabase Auth or demo accounts)
  - GET  /api/auth/me      (Get authenticated user profile)
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.report_model import User
from app.utils.db import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Pre-configured demo accounts matching AuthContext.jsx
DEMO_USERS = {
    "farmer@gmail.com": {
        "password": "farmer123",
        "user": {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "farmer@gmail.com",
            "name": "Sunil Wickramasinghe",
            "role": "farmer",
            "district": "Gampaha",
            "phone": "0771234567",
            "preferred_language": "en",
            "farm_id": "farm-gampaha-01",
        },
        "redirectTo": "/farmer",
    },
    "officer@gmail.com": {
        "password": "officer123",
        "user": {
            "id": "00000000-0000-0000-0000-000000000002",
            "email": "officer@gmail.com",
            "name": "Dr. Bandara Rajapaksha",
            "role": "officer",
            "district": "Western Province",
            "badge": "AO-WP-2026",
            "phone": "0719876543",
            "preferred_language": "en",
        },
        "redirectTo": "/officer",
    },
}


# ── Pydantic Request Models ───────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="farmer", pattern="^(farmer|officer)$")
    district: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    badge: Optional[str] = Field(default=None, max_length=100)
    preferred_language: str = Field(default="en", pattern="^(en|si|ta)$")


class LoginRequest(BaseModel):
    email: str
    password: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user (Farmer or Agriculture Officer).
    1. Creates and confirms the user directly in Supabase Auth.
    2. Persists the user profile in the database.
    3. Issues session token and returns dashboard redirect.
    """
    clean_email = body.email.strip().lower()
    clean_name = body.name.strip()
    role = body.role.lower()

    sb = get_supabase()
    user_id = None
    access_token = None

    # 1. Attempt Supabase Auth Admin creation
    try:
        sb_res = sb.auth.admin.create_user({
            "email": clean_email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {
                "name": clean_name,
                "role": role,
                "district": body.district,
                "phone": body.phone,
                "badge": body.badge,
                "preferred_language": body.preferred_language,
            },
        })
        if sb_res and sb_res.user:
            user_id = uuid.UUID(sb_res.user.id)
            logger.info("Supabase Auth user created successfully: %s (%s)", user_id, clean_email)
    except Exception as exc:
        err_msg = str(exc).lower()
        if "already registered" in err_msg or "already exists" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please sign in.",
            )
        logger.warning("Supabase Admin signup fallback (%s). Generating local UUID.", exc)
        user_id = uuid.uuid4()

    # 2. Try to get a real session token via sign_in
    try:
        sign_in_res = sb.auth.sign_in_with_password({
            "email": clean_email,
            "password": body.password,
        })
        if sign_in_res and sign_in_res.session:
            access_token = sign_in_res.session.access_token
    except Exception as exc:
        logger.debug("Could not auto-login to Supabase after signup: %s", exc)
        access_token = f"tok_{uuid.uuid4().hex}"

    # 3. Store in local DB (User table)
    existing_local = db.query(User).filter(User.email == clean_email).first()
    if not existing_local:
        db_user = User(
            id=user_id,
            email=clean_email,
            name=clean_name,
            role=role,
            district=body.district,
            phone=body.phone,
            badge=body.badge,
            preferred_language=body.preferred_language,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # 4. Attempt to store in Supabase public.users if table is available
    try:
        sb.table("users").upsert({
            "id": str(user_id),
            "email": clean_email,
            "name": clean_name,
            "role": role,
            "district": body.district,
            "phone": body.phone,
            "badge": body.badge,
            "preferred_language": body.preferred_language,
        }).execute()
    except Exception as exc:
        logger.debug("Supabase public.users sync deferred: %s", exc)

    redirect_to = "/officer" if role == "officer" else "/farmer"

    user_payload = {
        "id": str(user_id),
        "email": clean_email,
        "name": clean_name,
        "role": role,
        "district": body.district,
        "phone": body.phone,
        "badge": body.badge,
        "preferred_language": body.preferred_language,
        "farmer_id": str(user_id) if role == "farmer" else None,
        "officer_id": str(user_id) if role == "officer" else None,
    }

    return {
        "success": True,
        "data": {
            "user": user_payload,
            "token": access_token,
            "redirectTo": redirect_to,
        },
        "message": f"Welcome to AgriNova AI, {clean_name}! Account created successfully.",
    }


@router.post("/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user.
    1. Checks demo credentials first for instant developer access.
    2. Then validates against Supabase Auth.
    3. Falls back to local database.
    """
    clean_email = body.email.strip().lower()
    clean_password = body.password.strip()

    # 1. Demo accounts check
    if clean_email in DEMO_USERS:
        demo = DEMO_USERS[clean_email]
        if clean_password == demo["password"]:
            return {
                "success": True,
                "data": {
                    "user": demo["user"],
                    "token": f"demo-token-{demo['user']['role']}",
                    "redirectTo": demo["redirectTo"],
                },
                "message": f"Signed in as {demo['user']['name']}.",
            }

    # 2. Supabase Auth sign-in
    sb = get_supabase()
    try:
        sb_res = sb.auth.sign_in_with_password({
            "email": clean_email,
            "password": clean_password,
        })
        if sb_res and sb_res.user:
            u = sb_res.user
            meta = u.user_metadata or {}
            role = meta.get("role", "farmer").lower()
            redirect_to = "/officer" if role == "officer" else "/farmer"

            user_payload = {
                "id": u.id,
                "email": u.email,
                "name": meta.get("name", clean_email.split("@")[0]),
                "role": role,
                "district": meta.get("district"),
                "phone": meta.get("phone"),
                "badge": meta.get("badge"),
                "preferred_language": meta.get("preferred_language", "en"),
                "farmer_id": u.id if role == "farmer" else None,
                "officer_id": u.id if role == "officer" else None,
            }

            return {
                "success": True,
                "data": {
                    "user": user_payload,
                    "token": sb_res.session.access_token if sb_res.session else f"tok_{uuid.uuid4().hex}",
                    "redirectTo": redirect_to,
                },
                "message": f"Welcome back, {user_payload['name']}!",
            }
    except Exception as exc:
        logger.debug("Supabase sign_in failed: %s", exc)

    # 3. Local DB fallback (for registered users before supabase sync)
    local_user = db.query(User).filter(User.email == clean_email).first()
    if local_user:
        role = local_user.role.lower()
        redirect_to = "/officer" if role == "officer" else "/farmer"
        user_payload = {
            "id": str(local_user.id),
            "email": local_user.email,
            "name": local_user.name,
            "role": role,
            "district": local_user.district,
            "phone": local_user.phone,
            "badge": local_user.badge,
            "preferred_language": local_user.preferred_language,
            "farmer_id": str(local_user.id) if role == "farmer" else None,
            "officer_id": str(local_user.id) if role == "officer" else None,
        }
        return {
            "success": True,
            "data": {
                "user": user_payload,
                "token": f"local-tok-{local_user.id}",
                "redirectTo": redirect_to,
            },
            "message": f"Welcome back, {local_user.name}!",
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password. Please verify your credentials or create a new account.",
    )


@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Return currently authenticated user from token or active session.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
        )

    token = authorization.split(" ")[1]
    sb = get_supabase()

    try:
        u_res = sb.auth.get_user(token)
        if u_res and u_res.user:
            u = u_res.user
            meta = u.user_metadata or {}
            role = meta.get("role", "farmer").lower()
            return {
                "success": True,
                "data": {
                    "id": u.id,
                    "email": u.email,
                    "name": meta.get("name"),
                    "role": role,
                    "district": meta.get("district"),
                    "phone": meta.get("phone"),
                    "badge": meta.get("badge"),
                },
            }
    except Exception as exc:
        logger.debug("Token validation with Supabase failed: %s", exc)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired or invalid token.",
    )
