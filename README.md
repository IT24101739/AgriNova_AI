# AgriShield / CropGuard AI — CodeArena'26 Topic 05

> **Early Warning for Crop Disease Across a Region**  
> An end-to-end system where farmers upload leaf photos to receive AI diagnoses and advice in Sinhala, Tamil, or English, while Agriculture Officers detect regional disease outbreaks, inspect evidence, and manage field visits.

---

## 👥 Team Structure & Feature Slices

| Feature Slice | Responsibility & Modules |
|---------------|--------------------------|
| **Feature Slice 1** | Farmer photo upload, plant disease AI classifier (EfficientNet-B0), severity estimator (HSV/OpenCV), reports DB. |
| **Feature Slice 2** | Smart diagnosis, weather risk check (Open-Meteo), farmer advisory engine (LLM), notifications. |
| **Feature Slice 3** | Agriculture Officer Dashboard, low-confidence ticket management, regional map (Leaflet), field visit workflow, outbreak management, AI Officer assistant, and AI feedback loop. |

---

## 🚀 Quick Start

### 1. Database Setup
Open **Supabase SQL Editor** and run `supabase/migration.sql`.

Create the image storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT DO NOTHING;
```

---

### 2. Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

### 3. Frontend (React + Vite + Tailwind CSS)

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

- **App Portal**: `http://localhost:5173`
- **Officer Dashboard**: `http://localhost:5173/officer`

---

## 🔗 Shared Integration Interface (Dev 2 ← Dev 3)

After AI scoring in the diagnosis pipeline, if a report requires human officer attention:

```python
from app.services.ticket_service import create_officer_ticket, LOW_CONFIDENCE, HIGH_SEVERITY, OUTBREAK_RISK

create_officer_ticket(
    report_id="<uuid>",
    reason=LOW_CONFIDENCE,   # LOW_CONFIDENCE | HIGH_SEVERITY | OUTBREAK_RISK | UNKNOWN_DISEASE
    priority="HIGH",         # HIGH | MEDIUM | LOW
)
```

Farmer notifications consume:
- `GET /api/users/{user_id}/notifications`
- `PATCH /api/notifications/{id}/read`

---

## 🗄️ Shared Supabase Schema
`users`, `farms`, `reports`, `analysis_results`, `officer_tickets`, `field_visits`, `outbreaks`, `notifications`, `ai_feedback`, `lab_requests`
