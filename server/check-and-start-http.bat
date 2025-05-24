@echo off
echo Checking if HTTP server is running on port 3002...

REM Check if the port is already in use
netstat -ano | findstr ":3002" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo HTTP server is already running on port 3002.
) else (
    echo Port 3002 is available. Starting HTTP server...
    cd /d D:\tldraw-mcp\server
    start cmd /k "npm run start:http"
    echo HTTP server started in a new window.
)

pause
