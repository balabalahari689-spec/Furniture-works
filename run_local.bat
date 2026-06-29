@echo off
title SVS Furniture Tracker Launcher
echo ==========================================================
echo  Launching SVS Furniture Works Production Tracker...
echo ==========================================================
echo.

set PATH=%~dp0.node;%PATH%
cd /d "%~dp0"

echo [1/3] Starting Backend Server...
start "SVS Backend Server" cmd /k "cd backend && npm run dev"

echo [2/3] Starting Frontend Server...
start "SVS Frontend Server" cmd /k "cd frontend && set VITE_API_URL=http://localhost:5000&& npm run dev"

echo [3/3] Opening Workstation in your default browser...
echo Waiting 5 seconds for servers to initialize...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ==========================================================
echo  Done! Both servers are running locally.
echo ==========================================================
pause
