@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: WearWise Orchestrator - MOVED TO SCRIPTS/DEV
:: Switch to the script's directory and resolve absolute paths
cd /d "%~dp0"
set "SCRIPTS_DIR=%CD%"
pushd ..\..
set "ROOT_DIR=%CD%"
popd

:: Setup absolute paths for services
set "AI_DIR=%ROOT_DIR%\ai_engine"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"

if exist "config.bat" (
    call "config.bat"
) else (
    echo [EROARE] config.bat lipseste din directorul scripts/dev!
    pause
    exit /b
)

goto :MAIN_MENU

:: CORE FUNCTIONS (REDUCED FOR BREVITY, REST OF LOGIC FOLLOWS)
:START_SERVICE
echo  [ORCHESTRATOR] Deschidem fereastra pentru %~1...
start "%~1" cmd /k "color %~2 && title WEARWISE :: %~1 && cd /d "%~3" && echo. && echo  ======================================================= && echo  [INIT] %~1 pornit la %time% && echo  ======================================================= && echo. && %~4 & echo. & echo  ======================================================= & echo  [STOP] Procesul s-a incheiat (cod: !errorlevel!). & echo  Inchide manual aceasta fereastra dupa ce verifici. & echo  ======================================================= & pause >nul"
goto :EOF

:CHECK_PYTHON
set "PYTHON_OK=0"
set "PYTHON_CMD=python"
:: Try to use venv if it exists (absolute path)
if exist "%AI_DIR%\.venv\Scripts\python.exe" (
    set "PYTHON_OK=1"
    set "PYTHON_CMD=%AI_DIR%\.venv\Scripts\python.exe"
    goto :EOF
)
if exist "%AI_DIR%\venv\Scripts\python.exe" (
    set "PYTHON_OK=1"
    set "PYTHON_CMD=%AI_DIR%\venv\Scripts\python.exe"
    goto :EOF
)
:: de ce aici sunt doua ifuri?

:: Fallback to system python
python --version >nul 2>&1
if %errorlevel% == 0 ( set "PYTHON_OK=1" & goto :EOF )
py --version >nul 2>&1
if %errorlevel% == 0 ( set "PYTHON_OK=1" & set "PYTHON_CMD=py" & goto :EOF )
goto :EOF

:CHECK_PORT
set "PORT_BUSY=0"
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R /C:":%~1 " ^| findstr "LISTENING"') do ( set "PORT_BUSY=1" & set "BUSY_PID=%%p" )
goto :EOF

:WAIT_COUNTDOWN
echo  [ORCHESTRATOR] Asteptam %~1 secunde pentru stabilizare...
timeout /t %~1 >nul
goto :EOF

:MAIN_MENU
cls
echo  ===========================================================
echo    WEARWISE DEV ORCHESTRATOR v3.2 (Organized Mode)
echo  ===========================================================
echo.
echo   [ALL]     AI (Local) + Backend + Frontend
echo   [REMOTE]  AI (Online) + Backend + Frontend
echo   [LOCAL]   Backend Local + Frontend (API -^> localhost)
echo   [S]       Stop (Elibereaza porturile)
echo   [Q]       Iesire
echo.
set /p "choice=  Alege optiunea: "

if /I "!choice!"=="ALL"    goto :START_ALL
if /I "!choice!"=="REMOTE" goto :START_REMOTE
if /I "!choice!"=="LOCAL"  goto :START_LOCAL
if /I "!choice!"=="S"      goto :STOP_ALL
if /I "!choice!"=="Q"      exit /b
goto :MAIN_MENU

:START_ALL
echo.
echo  [ORCHESTRATOR] Incepem pornirea secventiala (LOCAL AI)...
call :CHECK_PYTHON
if "!PYTHON_OK!"=="0" ( echo [EROARE] Python nu a fost gasit! & pause & goto :MAIN_MENU )
call :CHECK_PORT %AI_PORT%
if "!PORT_BUSY!"=="1" taskkill /F /PID !BUSY_PID! >nul 2>&1
call :START_SERVICE "AI_ENGINE" "0A" "%AI_DIR%" "set AI_PORT=%AI_PORT%&& !PYTHON_CMD! serve.py"
call :WAIT_COUNTDOWN 5
call :CHECK_PORT %BACKEND_PORT%
if "!PORT_BUSY!"=="1" taskkill /F /PID !BUSY_PID! >nul 2>&1
:: Use localhost for AI_ENGINE_URL in the backend process
call :START_SERVICE "BACKEND" "0C" "%BACKEND_DIR%" "set AI_ENGINE_URL=http://localhost:%AI_PORT% && node server.js"
call :WAIT_COUNTDOWN 3
call :START_SERVICE "FRONTEND" "09" "%FRONTEND_DIR%" "set EXPO_PUBLIC_API_URL=http://localhost:%BACKEND_PORT%&& npx expo start"
call :WAIT_COUNTDOWN 2
echo.
echo  [ORCHESTRATOR] Deschidem Browserul...
start %FRONTEND_URL%
pause
goto :MAIN_MENU

:START_REMOTE
echo.
echo  [ORCHESTRATOR] Incepem pornirea (Backend Local + Online AI)...
:: Skip local AI engine
call :CHECK_PORT %BACKEND_PORT%
if "!PORT_BUSY!"=="1" taskkill /F /PID !BUSY_PID! >nul 2>&1
:: Backend will use AI_ENGINE_URL from its .env (already points to Hugging Face)
call :START_SERVICE "BACKEND" "0C" "%BACKEND_DIR%" "node server.js"
call :WAIT_COUNTDOWN 3
call :START_SERVICE "FRONTEND" "09" "%FRONTEND_DIR%" "npx expo start"
call :WAIT_COUNTDOWN 2
echo.
echo  [ORCHESTRATOR] Deschidem Browserul...
start %FRONTEND_URL%
pause
goto :MAIN_MENU

:START_LOCAL
echo.
echo  [ORCHESTRATOR] Incepem pornirea (Backend Local + Frontend -> localhost)...
call :CHECK_PORT %BACKEND_PORT%
if "!PORT_BUSY!"=="1" taskkill /F /PID !BUSY_PID! >nul 2>&1
call :START_SERVICE "BACKEND" "0C" "%BACKEND_DIR%" "set PORT=%BACKEND_PORT%&& node server.js"
call :WAIT_COUNTDOWN 3
call :START_SERVICE "FRONTEND" "09" "%FRONTEND_DIR%" "set EXPO_PUBLIC_API_URL=http://localhost:%BACKEND_PORT%&& npx expo start"
call :WAIT_COUNTDOWN 2
echo.
echo  [ORCHESTRATOR] Deschidem Browserul...
start %FRONTEND_URL%
pause
goto :MAIN_MENU

:STOP_ALL
for %%p in (%AI_PORT% %BACKEND_PORT% %FRONTEND_PORT%) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%%p " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%i >nul 2>&1
    )
)
taskkill /F /FI "WINDOWTITLE eq WEARWISE :: *" >nul 2>&1
pause
goto :MAIN_MENU
