# AgriShield — Feature Slice 1
## Farmer Reporting + Plant Disease AI + Severity Estimation

> Developer 1 — CodeArena'26 Topic 05 — Agriculture

---

## Quick Start

### 1. Database — Run migration once
Open **Supabase SQL Editor** and run `supabase/migration.sql`.

Then create the storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT DO NOTHING;
```

---

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, DATABASE_URL

# Run in DEV_MODE (no model file needed)
# In .env: DEV_MODE=true

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 3. AI Model (optional — DEV_MODE works without it)

To use a real PlantVillage model:
1. Train or download an EfficientNet-B0 model on 38-class PlantVillage dataset
2. Save weights as `backend/models/plant_disease_efficientnet.pth`
3. Set `MODEL_PATH=./models/plant_disease_efficientnet.pth` in `.env`
4. Set `DEV_MODE=false`

---

### 4. Frontend

```bash
cd frontend

# Copy env
copy .env.example .env

# Start dev server
npm run dev
```

Open: http://localhost:5173

---

## Architecture

```
Farmer (Mobile Browser)
    ↓ multipart/form-data
FastAPI POST /api/reports
    ↓
Supabase Storage (image upload)
    ↓
PostgreSQL INSERT reports (status=ANALYZING)
    ↓
disease_classifier.py (EfficientNet-B0)
    ↓
severity_estimator.py (HSV/OpenCV)
    ↓
PostgreSQL INSERT analysis_results
PostgreSQL UPDATE reports (status=IMAGE_ANALYZED)
    ↓
GET /api/reports/{id}  ← Member 2 reads this
```

---

## Member 2 Service Contract

```
GET /api/reports/{report_id}
```

```json
{
  "success": true,
  "data": {
    "id": "...",
    "farm_id": "...",
    "crop": "Tomato",
    "latitude": 7.2906,
    "longitude": 80.6337,
    "description": "...",
    "image_url": "...",
    "preferred_language": "si",
    "status": "IMAGE_ANALYZED",
    "image_analysis": {
      "disease": "Tomato Early Blight",
      "confidence": 0.91,
      "severity": "MODERATE",
      "affected_percentage": 31.4
    }
  },
  "message": ""
}
```

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Submit new report (multipart/form-data) |
| GET | `/api/reports/{id}` | Get report + AI results (Member 2 contract) |
| GET | `/api/farms/{farm_id}/reports` | List farm reports |
| GET | `/health` | Health check + AI status |

---

## Project Structure

```
mmmm/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── FarmerHome.jsx
│       │   ├── NewReport.jsx
│       │   └── ReportStatus.jsx
│       ├── components/
│       │   ├── ImageUploader.jsx
│       │   ├── CropSelector.jsx
│       │   ├── LanguageSelector.jsx
│       │   ├── LocationSelector.jsx
│       │   ├── ReportCard.jsx
│       │   └── AnalysisProgress.jsx
│       └── services/
│           └── api.js
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── routers/reports.py
│       ├── services/
│       │   ├── report_service.py
│       │   └── storage_service.py
│       ├── schemas/report.py
│       ├── models/
│       │   ├── database.py
│       │   └── report_model.py
│       └── ai/
│           ├── disease_classifier.py
│           └── severity_estimator.py
└── supabase/
    └── migration.sql
```
