@echo off
REM Windows: one-time setup. Safe to run again. Double-click this file, or run: setup.bat
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 run.py setup
) else (
  python run.py setup
)
pause
