@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo  Auto translate PPT - local preview
echo  This only serves the static files (no API relay).
echo  Press Ctrl+C to stop. The browser opens automatically.
echo ============================================================

where node >nul 2>nul
if errorlevel 1 goto :nonode

node preview.cjs
if errorlevel 1 goto :fail
goto :eof

:nonode
echo.
echo [ERROR] Node.js not found. Install Node.js 16+ from https://nodejs.org
echo         (Or just open the deployed GitHub Pages URL instead.)
echo.
pause
exit /b 1

:fail
echo.
echo [ERROR] Failed to start. Port 4173 may already be in use.
echo Close the previous preview window (Ctrl+C) and try again.
echo.
pause
exit /b 1