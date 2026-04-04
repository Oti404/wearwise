@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ===================================================
::  WEARWISE MAIN REPO (UMBRELA) - SCRIPT CONTROL v1.0
:: ===================================================

:: Ensure we are in the root directory relative to this script
pushd "%~dp0..\.."

:: HARDCODED DEFAULT REPO (Snapback Feature)
set "TARGET_REMOTE=https://github.com/wearwiseteam/wearwise.git"

:MENU
:: Resetam variabilele
SET REPO_URL=NICIUN_SERVER_SETAT
SET CURRENT_BRANCH=NICIUNA

:: Preluam URL-ul si ramura la fiecare afisare a meniului
FOR /F "tokens=*" %%g IN ('git config --get remote.origin.url') do (SET REPO_URL=%%g)
FOR /F "tokens=*" %%g IN ('git branch --show-current') do (SET CURRENT_BRANCH=%%g)

:: Sincronizam automat cu serverul hardcodat daca e diferit (Snapback)
if not "!REPO_URL!"=="!TARGET_REMOTE!" (
    echo [AUTO] Re-conectare la serverul principal WearWise...
    git remote remove origin >nul 2>&1
    git remote add origin !TARGET_REMOTE!
    SET REPO_URL=!TARGET_REMOTE!
)

cls
echo ===================================================
echo  WEARWISE MAIN REPO (UMBRELA) - SCRIPT CONTROL
echo ===================================================
echo DESTINATIE: !REPO_URL!
echo RAMURA:     !CURRENT_BRANCH!
echo ===================================================
echo 1. Sincronizeaza cu serverul (Descarca noutatile)
echo 2. Verifica starea proiectului (Git Status)
echo 3. Salveaza si trimite codul pe server (NECESITA PAROLA)
echo ===================================================
echo b. Afiseaza TOATE ramurile (Locale si pe Server)
echo c. Afiseaza istoricul de COMMIT-URI
echo u. DEZLEAGA repository-ul de serverul online curent
echo l. LEAGA repository-ul la un server online nou
echo 0. Iesire
echo ===================================================
set /p choice="Alege o optiune: "

if "%choice%"=="1" goto PULL_MAIN
if "%choice%"=="2" goto CHECK_STATUS
if "%choice%"=="3" goto PUSH_MAIN
if /I "%choice%"=="b" goto SHOW_BRANCHES
if /I "%choice%"=="c" goto SHOW_COMMITS
if /I "%choice%"=="u" goto UNLINK_REMOTE
if /I "%choice%"=="l" goto LINK_REMOTE
if "%choice%"=="0" popd & exit /b
goto MENU

:PULL_MAIN
echo.
echo --- SINCRONIZARE (PULL) ---
git pull origin main
if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] Repository-ul principal a fost actualizat!
) else (
    echo.
    echo [EROARE] Pull-ul a esuat. Verifica internetul sau conflictele locale.
)
pause
goto MENU

:CHECK_STATUS
echo.
echo --- STARE REPOSITORY (STATUS) ---
git fetch origin
git status
echo.
pause
goto MENU

:PUSH_MAIN
echo.
echo --- PUSH SECURIZAT ---
set /p parola="Introdu parola de administrator: "

if not "!parola!"=="wearwise" (
    echo.
    echo [ACCES RESPINS] Parola incorecta! Push interzis.
    pause
    goto MENU
)

echo.
echo Parola acceptata.
set /p commit_msg="Mesaj pentru commit: "
if "!commit_msg!"=="" set commit_msg="Actualizare repository principal umbrela"

git add .
git commit -m "!commit_msg!"
echo.
echo Se trimite pe server...
git push origin main
echo.
echo [SUCCES] Modificarile au fost salvate pe server!
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
set /p confirm_unlink="Dezlegi serverul? (Y/N): "
if /I "!confirm_unlink!"=="Y" (
    git remote remove origin
    echo [OK] Link sters (va fi refacut automat la urmatoarea rulare datorita Snapback).
)
pause
goto MENU

:LINK_REMOTE
echo.
set /p new_url="Introdu noul link (va fi suprascris de cel oficial): "
if not "!new_url!"=="" (
    git remote add origin !new_url!
)
pause
goto MENU
