@echo off
setlocal enabledelayedexpansion

:: -------------------------------------------------
:: CONSOLA DE CONTROL WEARWISE (v2.0)
:: Proprietate: Oti404
:: -------------------------------------------------

cd /d "%~dp0"
set "ROOT_DIR=%CD%"

:: 1. Verificare Config
if exist "scripts\dev\config.bat" (
    call "scripts\dev\config.bat"
)

:: -------------------------------------------------
:: MENIUL PRINCIPAL
:: -------------------------------------------------
:MENU
cls
echo ==========================================================
echo   WEARWISE - GIT and GITHUB CONSOLE (v2.0)
echo ==========================================================
echo.
echo   [1] DEVELOPER - Branching, Commit, Push, Merge to Dev
echo   [2] ADMIN     - Releases, Tags, Main, Sync Modules
echo   [Q] Iesire
echo.
set "choice="
set /p "choice=Selecteaza actiunea: "

if "!choice!"=="1" goto :DEV_MENU
if "!choice!"=="2" goto :ADMIN_AUTH
if /I "!choice!"=="Q" exit /b
goto :MENU

:: =========================================================
::   SECTIUNEA DEVELOPER (fara parola)
:: =========================================================
:DEV_MENU
cls
echo ==========================================================
echo   MENIU DEVELOPER - WearWise Git Workflow
echo ==========================================================
echo.
echo   [B] BRANCHES      Lista ramuri
echo   [S] START          Incepe Feature nou (din develop)
echo   [C] SWITCH         Schimba ramura curenta
echo   [M] COMMIT         Salveaza schimbarile (Stage + Commit)
echo   [P] PUSH           Trimite ramura pe GitHub
echo   [G] MERGE          Merge ramura actuala in develop
echo   [L] LOG            Vezi ultimele modificari
echo   [X] BACK           Inapoi la meniul principal
echo.
set /p "dc=Selecteaza: "

if /I "!dc!"=="B" goto :DEV_BRANCHES
if /I "!dc!"=="S" goto :DEV_START
if /I "!dc!"=="C" goto :DEV_SWITCH
if /I "!dc!"=="M" goto :DEV_COMMIT
if /I "!dc!"=="P" goto :DEV_PUSH
if /I "!dc!"=="G" goto :DEV_MERGE
if /I "!dc!"=="L" goto :DEV_LOG
if /I "!dc!"=="X" goto :MENU
goto :DEV_MENU

:DEV_BRANCHES
echo.
echo [GIT] Ramurile actuale:
git branch -a
pause
goto :DEV_MENU

:DEV_START
echo.
set /p "fname=Nume Feature (ex: login_fix): "
if "!fname!"=="" goto :DEV_MENU
git checkout develop 2>nul || git checkout development 2>nul
git pull origin develop 2>nul || git pull origin development 2>nul
git checkout -b feature/!fname!
echo [OK] Esti pe feature/!fname!
pause
goto :DEV_MENU

:DEV_SWITCH
echo.
set "cnt=0"
for /f "tokens=*" %%b in ('git branch --list') do (
    set /a "cnt+=1"
    set "br=%%b"
    set "br=!br:* =!"
    set "sw[!cnt!]=!br!"
    echo [!cnt!] !br!
)
echo.
set /p "sc=Alege numarul (sau Q): "
if /I "!sc!"=="Q" goto :DEV_MENU
if defined sw[!sc!] (
    git checkout !sw[%sc%]!
)
pause
goto :DEV_MENU

:DEV_COMMIT
echo.
set /p "msg=Mesajul commit-ului: "
if "!msg!"=="" echo Mesajul este necesar. & pause & goto :DEV_MENU
git add .
git commit -m "!msg!"
echo [OK] Schimbari salvate local.
pause
goto :DEV_MENU

:DEV_PUSH
echo.
for /f "tokens=*" %%i in ('git branch --show-current') do set "CB=%%i"
echo [GIT] Trimitem !CB! pe GitHub...
git push origin !CB!
echo [OK] Trimis. Link PR: https://github.com/wearwiseteam/wearwise/pull/new/!CB!
pause
goto :DEV_MENU

:DEV_MERGE
echo.
for /f "tokens=*" %%i in ('git branch --show-current') do set "CB=%%i"
echo [GIT] Combinam !CB! in develop...
git checkout develop 2>nul || git checkout development 2>nul
git pull origin develop 2>nul || git pull origin development 2>nul
git merge !CB!
if %errorlevel% neq 0 (
    echo [EROARE] Conflicte! Rezolva manual.
    git merge --abort
    pause & goto :DEV_MENU
)
git push origin develop 2>nul || git push origin development 2>nul
echo [OK] Feature finalizat in develop.
pause
goto :DEV_MENU

:DEV_LOG
echo.
git log --oneline --graph --max-count=15 --decorate
pause
goto :DEV_MENU

:: =========================================================
::   SECTIUNEA ADMIN (protejata prin parola)
:: =========================================================
:ADMIN_AUTH
cls
echo ==========================================================
echo   AUTENTIFICARE ADMINISTRATOR
echo ==========================================================
echo.
set /p "pass=   Parola: "

if "!pass!"=="wearwise" (
    echo.
    echo   [ACCES PERMIS]
    timeout /t 1 >nul
    goto :ADMIN_MENU
) else (
    echo.
    echo   [ACCES REFUZAT] Parola gresita.
    timeout /t 3 >nul
    goto :MENU
)

:ADMIN_MENU
cls
echo ==========================================================
echo   ADMIN MENU - WEARWISE MANAGEMENT
echo ==========================================================
echo.
echo   [1] MERGE develop to releases  (Pregatire Lansare)
echo   [2] MERGE releases to main     (Lansare Oficiala)
echo   [3] CREATE VERSION TAG         (Eticheta wearwise-X.X.X)
echo   [4] SYNC MODULE REPOS          (Sincronizare sub-proiecte)
echo   [5] DELETE a branch            (Curatenie)
echo   [B] BACK TO MAIN MENU
echo   [Q] Quit
echo.
set "ac="
set /p "ac=Selecteaza: "

if "!ac!"=="1" goto :ADM_DEV_TO_REL
if "!ac!"=="2" goto :ADM_REL_TO_MAIN
if "!ac!"=="3" goto :ADM_TAG
if "!ac!"=="4" goto :ADM_SYNC
if "!ac!"=="5" goto :ADM_DELETE
if /I "!ac!"=="B" goto :MENU
if /I "!ac!"=="Q" exit /b
goto :ADMIN_MENU

:ADM_DEV_TO_REL
echo.
echo [ADMIN] Pregatim Release-ul...
git checkout releases 2>nul || git checkout -b releases
git merge develop
if %errorlevel% neq 0 (
    echo [CRITICAL] Conflicte la Release! Rezolva manual.
    git merge --abort
    pause & goto :ADMIN_MENU
)
git push origin releases
echo [OK] Ramura releases a fost actualizata.
pause
goto :ADMIN_MENU

:ADM_REL_TO_MAIN
echo.
echo [ADMIN] Lansare pe MAIN...
git checkout main
git merge releases
git push origin main
echo [OK] Versiunea este acum pe RAMURA PRINCIPALA!
pause
goto :ADMIN_MENU

:ADM_TAG
echo.
set /p "v=Versiunea (ex: 2.0.0): "
if "!v!"=="" goto :ADMIN_MENU
set "TAG=wearwise-!v!"
echo [TAG] Cream eticheta !TAG!...
git tag -a "!TAG!" -m "Version !v! - Stable Release"
git push origin "!TAG!"
echo.
echo [SYNC] Sincronizam modulele secundare...
call scripts\dev\sync_engine.bat "releases"
pause
goto :ADMIN_MENU

:ADM_SYNC
echo.
set /p "sbr=Sincronizam din ramura (implicit: releases): "
if "!sbr!"=="" set "sbr=releases"
call scripts\dev\sync_engine.bat "!sbr!"
pause
goto :ADMIN_MENU

:ADM_DELETE
echo.
set /p "dbr=Ce ramura vrei sa stergi?: "
if "!dbr!"=="" goto :ADMIN_MENU
echo [DANGER] Esti sigur ca stergi !dbr!? (Y/N)
set /p "confirm="
if /I "!confirm!"=="Y" (
    git branch -d "!dbr!"
    git push origin --delete "!dbr!"
    echo [OK] Ramura stearsa local si pe server.
)
pause
goto :ADMIN_MENU
