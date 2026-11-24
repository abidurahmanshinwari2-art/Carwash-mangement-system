@echo off
title ZAMZAM Carwash setup
cd /d "%~dp0"
echo.
echo Setting up ZAMZAM Carwash on %COMPUTERNAME%.
echo A desktop icon will be added so you can open the desk from the screen.
echo.
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed on %COMPUTERNAME%.
  echo Install the LTS version from https://nodejs.org and double-click Run.bat again.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing. This only happens once and needs internet.
  call npm install
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-shortcut.ps1"
if errorlevel 1 (
  echo The desktop icon could not be created.
  pause
  exit /b 1
)
echo.
echo Desktop icon created: ZAMZAM Carwash
echo Next time, open that icon on the screen. You do not need this folder.
echo.
call "%~dp0start.bat"
