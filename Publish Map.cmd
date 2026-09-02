@echo off
setlocal
set "publisher=%~dp0scripts\publish-map.ps1"
if not exist "%publisher%" set "publisher=%USERPROFILE%\OneDrive\Documents\campaign dashboard\scripts\publish-map.ps1"
if not exist "%publisher%" (
  echo Map publishing stopped: campaign-dashboard publisher not found.
  echo Expected: %USERPROFILE%\OneDrive\Documents\campaign dashboard\scripts\publish-map.ps1
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%publisher%"
set "publish_exit=%errorlevel%"
echo.
if not "%publish_exit%"=="0" echo Nothing was published. The message above explains what needs attention.
pause
exit /b %publish_exit%
