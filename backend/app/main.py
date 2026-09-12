from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers.analysis import router as analysis_router
from app.routers.weather import router as weather_router
from app.routers.additional_image import router as additional_image_router

app = FastAPI(
    title="AgriShield / CropGuard AI - API",
    description="Backend service for Smart Diagnosis, Weather Checking, Regional Outbreak Detection, and Multilingual AI Treatment Advice.",
    version="1.0.0"
)

# CORS configuration for Frontend local development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Feature Slice 2 routers
app.include_router(analysis_router)
app.include_router(weather_router)
app.include_router(additional_image_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AgriShield / CropGuard AI API",
        "slice": "Feature Slice 2 - Smart Diagnosis & Advisory Engine"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
