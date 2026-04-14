@echo off
setlocal enabledelayedexpansion
title WearWise Sync Console v2.2.0

:: WearWise Sync Console v2.2.0
cd /d "%~dp0"

if exist "scripts\dev\config.bat" call "scripts\dev\config.bat"

:MENU
cls
for /f "tokens=*" %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"
echo ==========================================================
echo   WEARWISE - GIT and GITHUB CONSOLE (v2.2.0)
echo ==========================================================
echo.
echo   Ramura curenta: %CURRENT_BRANCH%
echo.
echo   [1] DEVELOPER - Feature Work
echo   [2] ADMIN     - Releases and Main
echo   [Q] Iesire
echo.
set "choice="
set /p "choice=Selecteaza: "

if "%choice%"=="1" goto :DEV_MENU
if "%choice%"=="2" goto :ADMIN_AUTH
if /I "%choice%"=="Q" exit /b
goto :MENU

:DEV_MENU
cls
for /f "tokens=*" %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"
echo ==========================================================
echo   MENIU DEVELOPER
echo ==========================================================
echo.
echo   Ramura curenta: %CURRENT_BRANCH%
echo.
echo   [B] BRANCHES      Lista ramuri
echo   [S] START         Ramura noua
echo   [C] SWITCH        Schimba ramura
echo   [M] COMMIT        Salveaza schimbarile
echo   [V] VERIFY        Ruleaza TESTE
echo   [P] PUSH          Trimite pe GitHub
echo   [G] MERGE         Merge in develop
echo   [X] BACK          Inapoi
echo.
set "dc="
set /p "dc=Selecteaza: "

if /I "%dc%"=="B" goto :DEV_BRANCHES
if /I "%dc%"=="S" goto :DEV_START
if /I "%dc%"=="C" goto :DEV_SWITCH
if /I "%dc%"=="M" goto :DEV_COMMIT
if /I "%dc%"=="V" goto :DEV_VERIFY
if /I "%dc%"=="P" goto :DEV_PUSH
if /I "%dc%"=="G" goto :DEV_MERGE
if /I "%dc%"=="X" goto :MENU
goto :DEV_MENU

:DEV_VERIFY
echo.
call run_tests.bat
pause
goto :DEV_MENU

:DEV_BRANCHES
echo.
git branch -a
pause
goto :DEV_MENU

:DEV_START
cls
echo.
echo   [1] feature   - Functionalitate noua
echo   [2] bugfix    - Rezolvare bug
echo   [3] hotfix    - Patch urgent pe main
echo   [4] chore     - Mentenanta / refactor
echo   [5] docs      - Documentatie
echo   [6] test      - Teste
echo   [B] Anuleaza
echo.
set "btype="
set "prefix="
set /p "btype=Tip: "
if /I "%btype%"=="B" goto :DEV_MENU
if "%btype%"=="1" set "prefix=feature"
if "%btype%"=="2" set "prefix=bugfix"
if "%btype%"=="3" set "prefix=hotfix"
if "%btype%"=="4" set "prefix=chore"
if "%btype%"=="5" set "prefix=docs"
if "%btype%"=="6" set "prefix=test"
if "%prefix%"=="" goto :DEV_START
echo.
set "bname="
set /p "bname=Nume (%prefix%/???): "
if "%bname%"=="" goto :DEV_MENU
set "FULL_BRANCH=%prefix%/%bname%"
git checkout develop
git pull origin develop
git checkout -b "%FULL_BRANCH%"
echo.
echo [OK] Esti pe %FULL_BRANCH%
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
set "sc="
set /p "sc=Numar sau nume (Q=Anuleaza): "
if /I "%sc%"=="Q" goto :DEV_MENU
if "%sc%"=="" goto :DEV_MENU
echo %sc%| findstr /r "^[0-9]*$" >nul
if %errorlevel%==0 (
    git checkout "!sw[%sc%]!"
) else (
    git checkout "%sc%"
)
pause
goto :DEV_MENU

:DEV_COMMIT
echo.
set /p "msg=Mesaj: "
if "%msg%"=="" goto :DEV_MENU
git add .
git commit -m "%msg%"
echo [OK] Commit salvat.
pause
goto :DEV_MENU

:DEV_PUSH
echo.
for /f "tokens=*" %%i in ('git branch --show-current') do set "CB=%%i"
echo [GIT] Pull + Push pe %CB%...
git pull origin "%CB%"
git push origin "%CB%"
pause
goto :DEV_MENU

:DEV_MERGE
echo.
for /f "tokens=*" %%i in ('git branch --show-current') do set "CB=%%i"
if "%CB%"=="develop" (
    echo [EROARE] Esti pe develop.
    pause
    goto :DEV_MENU
)
echo [GIT] Combinam %CB% in develop...
git checkout develop
git pull origin develop
git merge "%CB%"
if errorlevel 1 (
    echo [EROARE] Conflict la merge!
    git merge --abort
    pause
    goto :DEV_MENU
)
git push origin develop
echo [OK] Sincronizat in develop.
echo [GIT] Curatam ramura locala %CB%...
git branch -d "%CB%"
pause
goto :DEV_MENU

:ADMIN_AUTH
cls
set /p "pass=Parola: "
if "%pass%"=="wearwise" goto :ADMIN_MENU
goto :MENU

:ADMIN_MENU
cls
for /f "tokens=*" %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"
echo ==========================================================
echo   MENIU ADMIN
echo ==========================================================
echo.
echo   Ramura curenta: %CURRENT_BRANCH%
echo.
echo   [1] CREATE RELEASE  develop -^> releases/wearwise_X-Y-Z
echo   [2] SHIP TO MAIN    releases/wearwise_X-Y-Z -^> main
echo   [3] CREATE TAG
echo   [B] BACK
echo.
set /p "ac=Selecteaza: "
if "%ac%"=="1" goto :ADM_DEV_TO_REL
if "%ac%"=="2" goto :ADM_REL_TO_MAIN
if "%ac%"=="3" goto :ADM_TAG
if /I "%ac%"=="B" goto :MENU
goto :ADMIN_MENU

:ADM_DEV_TO_REL
echo.
set "ver="
set /p "ver=Version (ex: 2-1-0): "
if "%ver%"=="" goto :ADMIN_MENU
set "REL_BRANCH=releases/wearwise_%ver%"
echo.
echo [GIT] Cream %REL_BRANCH% din develop...
git checkout develop
git pull origin develop
git checkout -b "%REL_BRANCH%"
git push origin "%REL_BRANCH%"
echo.
echo [OK] Branch %REL_BRANCH% creat si trimis pe GitHub.
pause
goto :ADMIN_MENU

:ADM_REL_TO_MAIN
echo.
set "ver="
set /p "ver=Version (ex: 2-1-0): "
if "%ver%"=="" goto :ADMIN_MENU
set "REL_BRANCH=releases/wearwise_%ver%"
echo.
echo [GIT] Mergem %REL_BRANCH% -^> main...
git checkout main
git pull origin main
git merge "%REL_BRANCH%"
if errorlevel 1 (
    echo [EROARE] Conflict la merge! Rezolva manual.
    git merge --abort
    pause
    goto :ADMIN_MENU
)
git pull origin main --rebase
git push origin main
echo [OK] main actualizat.
pause
goto :ADMIN_MENU

:ADM_TAG
echo.
set "ver="
set /p "ver=Version (ex: 2.1.0): "
if "%ver%"=="" goto :ADMIN_MENU
set "TAG=wearwise-%ver%"
git tag -a "%TAG%" -m "Release %ver%"
git push origin "%TAG%"
echo [OK] Tag %TAG% creat si trimis.
pause
goto :ADMIN_MENU
