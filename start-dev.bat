@echo off
echo ====================================================
echo Starting AgriShield / CropGuard AI - Local Dev
echo ====================================================

echo.
echo [1/2] Launching Backend FastAPI Server (Port 8000)...
start "AgriShield Backend" cmd /k "cd backend && (if not exist venv (python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt) else (call venv\Scripts\activate)) && uvicorn app.main:app --reload --port 8000"

echo.
echo [2/2] Launching Frontend React/Vite Dev Server (Port 5173)...
start "AgriShield Frontend" cmd /k "cd frontend && (if not exist node_modules (npm install)) && npm run dev"

echo.
echo ====================================================
echo Both servers have been launched in separate windows!
echo Backend:  http://localhost:8000 (Swagger docs at /docs)
echo Frontend: http://localhost:5173
echo ====================================================
pause
