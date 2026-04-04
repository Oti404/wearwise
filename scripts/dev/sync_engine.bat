@echo off
setlocal enabledelayedexpansion

:: -------------------------------------------------
:: WEARWISE - SYNC ENGINE (v2.0)
:: Proprietate: Oti404
:: -------------------------------------------------

set "BRANCH=%~1"
if "!BRANCH!"=="" set "BRANCH=develop"

echo.
echo [SYNC] Pornim sincronizarea modulelor pe ramura: !BRANCH!
echo.

:: 1. AI ENGINE
call :SYNC_MODULE "ai_engine" "https://github.com/wearwiseteam/wearwise_ai" "!BRANCH!"

:: 2. BACKEND
call :SYNC_MODULE "backend" "https://github.com/wearwiseteam/wearwise_backend" "!BRANCH!"

:: 3. FRONTEND
call :SYNC_MODULE "frontend" "https://github.com/wearwiseteam/wearwise_frontend" "!BRANCH!"

echo.
echo [OK] Sincronizare completa pentru toate modulele.
exit /b

:SYNC_MODULE
set "FOLDER=%~1"
set "REPO=%~2"
set "TARGET_BR=%~3"

if not exist "!FOLDER!" (
    echo [SKIP] Folderul !FOLDER! nu exista.
    exit /b
)

echo [MODULE] Sincronizam !FOLDER! -> !REPO! (!TARGET_BR!)
set "TEMP_DIR=.temp_sync_!FOLDER!"

if exist "!TEMP_DIR!" rd /s /q "!TEMP_DIR!"
mkdir "!TEMP_DIR!"

:: Clone repo separat
git clone --depth 1 --branch main "!REPO!" "!TEMP_DIR!" 2>nul
if %errorlevel% neq 0 (
    :: Daca main nu exista, incercam fara branch
    git clone --depth 1 "!REPO!" "!TEMP_DIR!"
)

pushd "!TEMP_DIR!"
    :: Ne asiguram ca suntem pe ramura corecta
    git checkout !TARGET_BR! 2>nul || git checkout -b !TARGET_BR!
    
    :: Curatam tot continutul (dar pastram folderul .git)
    for /f "delims=" %%i in ('dir /b /a-d') do del /f /q "%%i"
    for /f "delims=" %%i in ('dir /b /ad') do if /I "%%i" neq ".git" rd /s /q "%%i"
    
    :: Copiem noul continut din monorepo
    xcopy /e /y /q "..\!FOLDER!\*" "."
    
    :: Push direct
    git add -A
    git commit -m "Sync from Monorepo (WearWise 2.0.0)" 2>nul
    git push origin !TARGET_BR!
popd

rd /s /q "!TEMP_DIR!"
exit /b
