@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ===================================================
::  WEARWISE UNIVERSAL GIT SYNC v2.0 (Advanced)
:: ===================================================

set "TARGET_DIR=%~1"
if "!TARGET_DIR!"=="" set "TARGET_DIR=."

:: Resolve absolute path and switch to target dir
pushd "!TARGET_DIR!"
set "CUR_DIR=%CD%"
for %%i in ("%CUR_DIR%") do set "MODULE_NAME=%%~nxi"

:: 1. Initializare Git daca nu exista
if not exist ".git" (
    echo [INFO] Initializare repository Git local in !MODULE_NAME!...
    git init
)

:: 2. Incarcam URL-ul de REPO DEFAULT din .git_remote (Snapback Feature)
SET TARGET_REMOTE=NICIUNUL
if exist ".git_remote" (
    set /p TARGET_REMOTE=<.git_remote
)

:MENU
:: Resetam variabilele pentru a nu pastra date vechi
SET REPO_URL=NICIUN_SERVER_SETAT
SET CURRENT_BRANCH=NICIUNA

:: Preluam URL-ul si ramura la fiecare afisare a meniului
FOR /F "tokens=*" %%g IN ('git config --get remote.origin.url') do (SET REPO_URL=%%g)
FOR /F "tokens=*" %%g IN ('git branch --show-current') do (SET CURRENT_BRANCH=%%g)

:: AUTO-FIX origin daca e diferit de cel din .git_remote (Snapback)
if not "!TARGET_REMOTE!"=="NICIUNUL" if not "!TARGET_REMOTE!"=="!REPO_URL!" (
    echo [AUTO] Revenire la repository-ul oficial: !MODULE_NAME!
    git remote remove origin >nul 2>&1
    git remote add origin !TARGET_REMOTE!
    SET REPO_URL=!TARGET_REMOTE!
)

cls
echo ===================================================
echo  WEARWISE MODULE: [!MODULE_NAME!]
echo ===================================================
echo DESTINATIE: !REPO_URL!
echo RAMURA:     !CURRENT_BRANCH!
echo ===================================================
echo 1. Incepe un task NOU (Creeaza ramura noua din main)
echo 2. Continua un task VECHI (Schimba pe o ramura existenta)
echo 4. Salveaza si trimite codul pe server (Commit ^& Push)
echo 5. Deschide Pull Request (Cere adminului unirea cu main)
echo ===================================================
echo b. Afiseaza TOATE ramurile (Locale si pe Server)
echo c. Afiseaza istoricul de COMMIT-URI
echo u. DEZLEAGA repository-ul de serverul online curent
echo l. LEAGA repository-ul la un server online nou
echo 0. Iesire (Back to Shell)
echo ===================================================
set /p choice="Alege o optiune: "

if "%choice%"=="1" goto NEW_BRANCH
if "%choice%"=="2" goto EXISTING_BRANCH
if "%choice%"=="4" goto PUSH_CODE
if "%choice%"=="5" goto CREATE_PR
if /I "%choice%"=="b" goto SHOW_BRANCHES
if /I "%choice%"=="c" goto SHOW_COMMITS
if /I "%choice%"=="u" goto UNLINK_REMOTE
if /I "%choice%"=="l" goto LINK_REMOTE
if "%choice%"=="0" popd & exit /b
goto MENU

:NEW_BRANCH
echo.
if "!REPO_URL!"=="NICIUN_SERVER_SETAT" (
    echo [EROARE] Nu esti legat la niciun server!
    pause
    goto MENU
)
echo --- Descarcam ultimele actualizari de pe main ---
git checkout main
git pull origin main
echo.
set /p new_branch="Introdu numele noii ramuri: "
if /I "!new_branch!"=="main" (
    echo [EROARE] Nu poti lucra direct pe main!
    pause
    goto MENU
)
git checkout -b !new_branch!
echo.
echo [SUCCES] Ramura creata.
pause
goto MENU

:EXISTING_BRANCH
echo.
set /p exist_branch="Introdu numele ramurii pe care vrei sa revii: "
if /I "!exist_branch!"=="main" (
    echo [EROARE] Pentru a lucra pe main, foloseste Pull Request-uri.
    pause
    goto MENU
)
git checkout !exist_branch!
echo --- Actualizam ramura ta din main ---
git fetch origin main
git merge origin/main
pause
goto MENU

:SHOW_BRANCHES
echo.
git branch -a
pause
goto MENU

:SHOW_COMMITS
echo.
git log --oneline --graph --decorate -n 15
pause
goto MENU

:UNLINK_REMOTE
echo.
if "!REPO_URL!"=="NICIUN_SERVER_SETAT" (
    echo [INFO] Nu esti legat de niciun server.
    pause
    goto MENU
)
set /p confirm_unlink="Esti sigur ca vrei sa stergi legatura? (Y/N): "
if /I "!confirm_unlink!"=="Y" (
    git remote remove origin
    echo [SUCCES] Te-ai dezlegat de server.
)
pause
goto MENU

:LINK_REMOTE
echo.
if not "!REPO_URL!"=="NICIUN_SERVER_SETAT" (
    echo [EROARE] Esti deja legat la un server. Dezleaga-te intai cu 'u'.
    pause
    goto MENU
)
set /p new_url="Introdu noul link de GitHub: "
if not "!new_url!"=="" (
    git remote add origin !new_url!
    echo [SUCCES] Repository-ul a fost legat la !new_url!
)
pause
goto MENU

:PUSH_CODE
echo.
if /I "!CURRENT_BRANCH!"=="main" (
    echo [EROARE] Esti pe 'main'! Creeaza o ramura inainte.
    pause
    goto MENU
)
set /p proceed="Trimiti codul pe '!CURRENT_BRANCH!'? (Y/N): "
if /I not "!proceed!"=="Y" goto MENU

set /p commit_msg="Mesaj pentru commit: "
if "!commit_msg!"=="" set commit_msg="Update !date! !time!"

git add .
git commit -m "!commit_msg!"
echo Se trimite pe server...
git push -u origin !CURRENT_BRANCH!
pause
goto MENU

:CREATE_PR
echo.
if /I "!CURRENT_BRANCH!"=="main" (
    echo [EROARE] Esti pe 'main'!
    pause
    goto MENU
)
if "!REPO_URL!"=="NICIUN_SERVER_SETAT" (
    echo [EROARE] Nu esti legat la niciun server!
    pause
    goto MENU
)
set REPO_CLEAN=!REPO_URL:.git=!
set PR_URL=!REPO_CLEAN!/compare/main...!CURRENT_BRANCH!?expand=1
start "" "!PR_URL!"
echo [SUCCES] PR deschis in browser.
pause
goto MENU
