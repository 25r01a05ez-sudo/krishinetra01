@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  py -3 -m venv "backend\.venv" 2>nul
  if errorlevel 1 python -m venv "backend\.venv"
)
if not exist "backend\.venv\Scripts\python.exe" (
  echo Python 3.11 or newer is required. Install Python and enable Add Python to PATH.
  pause
  exit /b 1
)
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
"backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 (
  echo Dependency installation failed. Check the internet connection and try again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:5000 in your browser. Keep this window open.
echo Local verification codes appear in this window.
start "" "http://127.0.0.1:5000"
"backend\.venv\Scripts\python.exe" "backend\app.py"
pause
