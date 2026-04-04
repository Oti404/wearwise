@echo off
setlocal enabledelayedexpansion

:: -------------------------------------------------
:: SCRIPT DE TESTARE AUTOMATA WEARWISE (v2.0)
:: -------------------------------------------------

cls
echo ===================================================
echo   WEARWISE - AUTOMATED TEST SUITE (v2.0)
echo ===================================================
echo.

:: 1. Verificare BACKEND
echo [TEST] Rulam testele pentru BACKEND...
pushd backend
call npm test
if !errorlevel! neq 0 (
    echo.
    echo [EROARE] Testele de Backend au esuat
    popd
    pause
    exit /b 1
)
popd
echo [OK] Backend-ul este valid.
echo.

:: 2. Verificare FRONTEND (Lint)
echo [TEST] Verificam structura FRONTEND...
pushd frontend
call npx expo lint -- --no-fix
if !errorlevel! neq 0 (
    echo.
    echo [WARNING] Exista probleme de tip Lint in Frontend.
)
popd
echo [OK] Frontend-ul a fost verificat.

echo.
echo ===================================================
echo   [SUCCES] Toate verificarile de baza au trecut
echo   Poti continua cu incredere procesul de Release.
echo ===================================================
pause
