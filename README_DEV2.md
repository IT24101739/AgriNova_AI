# Developer 2 – Feature Slice 2
### Smart Diagnosis · Weather · Outbreak · AI Treatment · Multilingual Results

---

## What's in this slice

| Layer     | Files created by Dev 2 |
|-----------|------------------------|
| Backend   | `app/utils/db.py` · `app/schemas/analysis_schemas.py` |
| Services  | `app/services/weather_service.py` · `app/services/outbreak_service.py` |
| AI        | `app/ai/llm_client.py` · `app/ai/diagnosis_aggregator.py` · `app/ai/treatment_advisor.py` |
| Data      | `app/data/treatment_guidance.json` |
| Routers   | `app/routers/analysis.py` · `app/routers/weather.py` · `app/routers/additional_image.py` |
| Frontend  | `src/services/analysisService.js` |
| Components| `DiagnosisCard` · `ConfidenceIndicator` · `SeverityBadge` · `SpreadRiskBadge` · `WeatherEvidence` · `TreatmentSteps` · `NearbyOutbreakAlert` · `AdditionalPhotoRequest` |
| Pages     | `DiagnosisResult` · `AdditionalInfo` · `FarmerAlerts` |

---

## Integration steps for Member 1

### 1. Register Dev 2's routers in `main.py`

```python
# backend/app/main.py  (add these 3 lines)
from app.routers import analysis, weather, additional_image

app.include_router(analysis.router)
app.include_router(weather.router)
app.include_router(additional_image.router)
```

### 2. Add routes in `App.jsx` (or your router file)

```jsx
import DiagnosisResult from "./pages/DiagnosisResult";
import AdditionalInfo  from "./pages/AdditionalInfo";
import FarmerAlerts    from "./pages/FarmerAlerts";

// inside <Routes>
<Route path="/results/:reportId"         element={<DiagnosisResult />} />
<Route path="/additional-info/:reportId" element={<AdditionalInfo />} />
<Route path="/alerts"                    element={<FarmerAlerts />} />
```

### 3. After your image classifier saves the report, navigate to:

```js
navigate(`/results/${reportId}`);
```

Dev 2's page will automatically trigger `POST /api/reports/{reportId}/complete-analysis`.

---

## Required environment variables

Add these to `backend/.env`:

```env
# Supabase (shared with all devs)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key   # preferred for backend

# LLM (Dev 2 uses this for treatment advice generation)
LLM_PROVIDER=gemini            # or "openai"
LLM_API_KEY=your-api-key
LLM_MODEL=gemini-1.5-flash     # optional, this is the default

# Outbreak detection thresholds (optional – defaults shown)
OUTBREAK_RADIUS_KM=5.0
OUTBREAK_WINDOW_DAYS=7
OUTBREAK_HIGH_THRESHOLD=3

# Supabase Storage bucket name (shared with Member 1)
SUPABASE_STORAGE_BUCKET=crop-images

# Member 1's image analysis endpoint base URL (used by additional-image endpoint)
MEMBER1_API_BASE=http://localhost:8000
```

Add this to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## API endpoints (Dev 2)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/reports/{report_id}/complete-analysis` | Full pipeline (idempotent) |
| `GET`  | `/api/reports/{report_id}/advice?language=si` | Re-generate advice in different language |
| `GET`  | `/api/weather/risk?report_id=...` | Weather risk for a report |
| `GET`  | `/api/weather/risk?lat=...&lon=...` | Weather risk by coordinates |
| `POST` | `/api/reports/{report_id}/additional-image` | Submit additional photo |

All responses use the shared envelope:
```json
{ "success": true, "data": {}, "message": "" }
```

---

## Decision routing logic (deterministic, no LLM)

| Condition | Decision |
|-----------|----------|
| `confidence ≥ 0.80` | `AUTO_ADVICE` |
| `confidence 0.50–0.79` | `NEED_MORE_INFO` |
| `confidence < 0.50` | `OFFICER_REVIEW` |
| `severity HIGH + confidence < 0.80` | `OFFICER_REVIEW` |
| `outbreak HIGH + nearby ≥ 3` | `OUTBREAK_WARNING` |

## Interface to Member 3

When Dev 2 routes to `OFFICER_REVIEW` or `OUTBREAK_WARNING`, it:
- Inserts a stub row into `officer_tickets` (Member 3 picks it up)
- Inserts a suspected row into `outbreaks` (Member 3 confirms/rejects)

Member 3 does **not** need to call any Dev 2 endpoint — they read directly from the shared tables.

---

## Supabase tables used (read/write)

| Table | Operations |
|-------|-----------|
| `reports` | READ disease/confidence/severity/farm; UPDATE status+spread_risk |
| `farms` | READ latitude/longitude/crop |
| `analysis_results` | UPSERT (idempotent) |
| `officer_tickets` | INSERT stub on escalation |
| `outbreaks` | INSERT candidate on HIGH outbreak risk |
| `notifications` | INSERT farmer notification |
