# AgriShield — CodeArena'26 Topic 05

> Early Warning for Crop Disease Across a Region

## Team Structure

| Developer | Feature Slice |
|-----------|--------------|
| Dev 1 | Farmer upload, disease classifier, treatment AI |
| Dev 2 | Analysis pipeline, farmer dashboard, alerts |
| Dev 3 | Officer dashboard, tickets, regional map, field visits, outbreaks, AI feedback |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy env template and fill in values
copy .env.example .env

# Run dev server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Integration Points (Dev 2 ← Dev 3)

Dev 2's disease analysis pipeline should call:

```python
from app.services.ticket_service import create_officer_ticket, LOW_CONFIDENCE, HIGH_SEVERITY, OUTBREAK_RISK

# After AI scoring, if ticket needed:
create_officer_ticket(
    report_id="<uuid>",
    reason=LOW_CONFIDENCE,   # or HIGH_SEVERITY, OUTBREAK_RISK, UNKNOWN_DISEASE
    priority="HIGH",         # or MEDIUM, LOW
)
```

Dev 2's Farmer Alerts page consumes:
- `GET /api/users/{user_id}/notifications`
- `PATCH /api/notifications/{id}/read`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`

## Shared Database Tables

`users`, `farms`, `reports`, `analysis_results`, `officer_tickets`, 
`field_visits`, `outbreaks`, `notifications`, `ai_feedback`, `lab_requests`

All table names and field names follow the shared schema. Do NOT rename fields.
