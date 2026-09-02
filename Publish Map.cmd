@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish-map.ps1"
set "publish_exit=%errorlevel%"
echo.
if not "%publish_exit%"=="0" echo Nothing was published. The message above explains what needs attention.
pause
exit /b %publish_exit%
