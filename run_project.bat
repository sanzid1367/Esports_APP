@echo off
setlocal
cd /d "%~dp0"

echo ==========================================================
echo Starting E-Sports Tournament Management System...
echo ==========================================================

:: Start FastAPI backend in a new command window
echo Launching FastAPI Backend...
start "" cmd /k "cd /d "%~dp0backend" && call ..\venv\Scripts\activate && python main.py"

:: Wait 2 seconds for server to initialize
timeout /t 2 /nobreak >nul

:: Open the Frontend Dashboard in the default browser
echo Opening Frontend Dashboard...
start "" "%~dp0frontend\admin.html"

echo ==========================================================
echo System started successfully!
echo ==========================================================
endlocal
