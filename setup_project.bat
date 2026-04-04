@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ============================================================
::           WEARWISE UNIVERSAL SETUP v1.0
:: ============================================================

echo.
echo  ===========================================================
echo    WEARWISE PROJECT SETUP (Automated Clone)
echo  ===========================================================
echo.

:: 1. Definitii URL-uri
set "REPO_MAIN=https://github.com/wearwiseteam/wearwise.git"
set "REPO_BACKEND=https://github.com/wearwiseteam/wearwise-backend.git"
set "REPO_AI=https://github.com/wearwiseteam/wearwise-ai.git"
set "REPO_FRONTEND=https://github.com/wearwiseteam/wearwise-frontend.git"

:: 2. Intrebam de locatia instalarii
set /p "INSTALL_DIR=Introduceti folderul pentru instalare (sau lasati liber pentru folderul curent): "
if "!INSTALL_DIR!"=="" set "INSTALL_DIR=%CD%\WearWiseApp"

if not exist "!INSTALL_DIR!" (
    echo [INFO] Creare director: !INSTALL_DIR!
    mkdir "!INSTALL_DIR!"
)

cd /d "!INSTALL_DIR!"

:: 3. Clone Repository Principal
echo.
echo [1/4] Cloncare Repository Principal...
if not exist ".git" (
    git clone %REPO_MAIN% .
) else (
    echo [SKIP] Repository principal deja existent.
)

:: 4. Clone Sub-Module
echo.
echo [2/4] Clonare Module (Backend, Frontend, AI)...

:: Backend
if not exist "backend" mkdir "backend"
pushd backend
if not exist ".git" (
    git clone %REPO_BACKEND% .
    echo %REPO_BACKEND% > .git_remote
)
popd

:: Frontend
if not exist "frontend" mkdir "frontend"
pushd frontend
if not exist ".git" (
    git clone %REPO_FRONTEND% .
    echo %REPO_FRONTEND% > .git_remote
)
popd

:: AI Engine
if not exist "ai_engine" mkdir "ai_engine"
pushd ai_engine
if not exist ".git" (
    git clone %REPO_AI% .
    echo %REPO_AI% > .git_remote
)
popd

:: 5. Instalare Dependinte
echo.
echo [3/4] Instalare dependinte (Node.js ^& Python)...

:: Backend
echo.
echo  --- Instalare Backend (npm) ---
pushd backend
if exist "package.json" (
    call npm install
)
popd

:: Frontend
echo.
echo  --- Instalare Frontend (npm) ---
pushd frontend
if exist "package.json" (
    call npm install
)
popd

:: AI Engine
echo.
echo  --- Instalare AI Engine (Python) ---
pushd ai_engine
if exist "requirements.txt" (
    echo [INFO] Creare mediu virtual Python...
    python -m venv .venv
    call .venv\Scripts\pip install -r requirements.txt
    call .venv\Scripts\pip install python-dotenv
)
popd

:: 6. Finalizare
echo.
echo  ===========================================================
echo   [SUCCES] Proiectul WearWise a fost configurat complet!
echo  ===========================================================
echo.
echo   Director: !INSTALL_DIR!
echo.
echo   Poti folosi acum:
echo    - run.bat (pentru a porni aplicatia)
echo    - sync.bat (pentru a sincroniza cu serverul)
echo.
pause
