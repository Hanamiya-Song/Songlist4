@echo off
echo ==========================
echo   Build & Deploy Start
echo ==========================

cd /d %~dp0

echo.
echo Å° npm build...
call npm run build

echo.
echo Å° push to GitHub...
cd dist
git add .
git commit -m "auto deploy"
git push -f origin main

echo.
echo ==========================
echo   Deploy Complete !!
echo ==========================
pause