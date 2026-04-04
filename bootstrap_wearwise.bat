@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ============================================================
::           WEARWISE BOOTSTRAPPER v1.0
:: ============================================================
:: Ruleaza acest script intr-un folder GOL pentru a descarca
:: intreg ecosistemul WearWise.

echo.
echo  [Bootstrap] Incepem configurarea WearWise pe acest PC...
echo.

:: 1. Definitii
set "REPO_MAIN=https://github.com/wearwiseteam/wearwise.git"

:: 2. Clonare Root
echo [1/2] Clonare proiect principal...
git clone %REPO_MAIN% .

if %errorlevel% neq 0 (
    echo [EROARE] Clonarea a esuat. Verifica daca ai Git instalat si acces la internet.
    pause
    exit /b
)

:: 3. Executare Setup Intern
echo.
echo [2/2] Lansare script de configurare module...
if exist "setup_project.bat" (
    call setup_project.bat
) else (
    echo [EROARE] setup_project.bat nu a fost gasit in repo-ul clonat!
    pause
)

echo.
echo [GATA] Poti incepe dezvoltarea!
pause
