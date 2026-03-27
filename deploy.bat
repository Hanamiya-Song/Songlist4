@echo off
cd /d %~dp0

echo =========================
echo Build start...
echo =========================
call npm run build

echo =========================
echo Git add...
echo =========================
git add .

echo =========================
echo Commit...
echo =========================
set msg=deploy %date% %time%
git commit -m "%msg%"

echo =========================
echo Push...
echo =========================
git push

echo =========================
echo DEPLOY DONE !!
echo =========================
pause