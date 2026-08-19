@echo off
:: Start Backend (FastAPI)
start cmd /k "cd backend && python main.py"

:: Start Frontend (React Vite)
start cmd /k "cd frontend && npm run dev"

:: Automatically open the web browser to the local development URL
timeout /t 2 /nobreak > nul
start http://localhost:5173