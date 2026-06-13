@echo off
echo ==========================================================
echo Starting E-Sports Tournament Management System...
echo ==========================================================

:: Start FastAPI backend in a new command window
echo Launching FastAPI Backend...
start cmd /k "cd esports_python_app\backend && ..\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait 2 seconds for server to initialize
timeout /t 2 /nobreak >nul

:: Open the Frontend Dashboard in the default browser
echo Opening Frontend Dashboard...
start "" "esports_python_app\frontend\index.html"

echo ==========================================================
echo System started successfully!
echo ==========================================================
