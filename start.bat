@echo off
title ZAMZAM Carwash
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed on %COMPUTERNAME%.
  echo Install the LTS version from https://nodejs.org and run Run.bat again.
  pause
  exit /b 1
)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://127.0.0.1:3001"
  exit /b 0
)
if not exist "client\dist\index.html" (
  echo The screen files are missing. Installing the prepare tools. This needs internet.
  set NODE_ENV=
  call npm install --include=dev
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
  echo Preparing ZAMZAM Carwash on %COMPUTERNAME%.
  call npm run build
  if errorlevel 1 (
    echo Prepare failed.
    pause
    exit /b 1
  )
)
if not exist "node_modules\express\package.json" (
  echo Installing ZAMZAM Carwash on %COMPUTERNAME%. This needs internet once.
  set NODE_ENV=production
  call npm install --omit=dev
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)
echo.
echo ZAMZAM Carwash is starting on %COMPUTERNAME%.
echo Leave this window open while the desk is in use.
echo.
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://127.0.0.1:3001"
call npm run start -w server
pause
