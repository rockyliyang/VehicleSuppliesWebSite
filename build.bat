@echo off

:: Exit immediately if a command exits with a non-zero status.
setlocal enabledelayedexpansion

:: --- Configuration ---
set "RELEASE_DIR=release"
set "FRONTEND_DIR=frontend"
set "BACKEND_DIR=backend"
set "BACKEND_ARCHIVE_NAME=backend.tar.gz"

:: --- Main Script ---

:: 1. Clean up previous release directory
echo [BUILD] Cleaning up previous release directory...
if exist "%RELEASE_DIR%" (
    rmdir /s /q "%RELEASE_DIR%"
)
mkdir "%RELEASE_DIR%"

:: 2. Build Frontend
echo [BUILD] Starting frontend build...
cd "%FRONTEND_DIR%"
call npm install
:: Set output directory to release/frontend_dist to avoid move operation
set "VUE_OUTPUT_DIR=../%RELEASE_DIR%/frontend_dist"
call npm run build
cd ..

:: 4. Package Backend
echo [BUILD] Packaging backend application...
:: Create a tarball of the backend, excluding node_modules and other unnecessary files
:: Assumes 'tar' command is available (e.g., from Git for Windows)
tar --exclude="node_modules" ^
    --exclude=".git" ^
    --exclude=".DS_Store" ^
    --exclude="./public/static/images"^
    --exclude="./public/static/videos"^
    -czvf "%RELEASE_DIR%\%BACKEND_ARCHIVE_NAME%" ^
    -C "%BACKEND_DIR%" .

:: 5. Copy database migration scripts
echo [BUILD] Copying database scripts...
mkdir "%RELEASE_DIR%\db"
xcopy /s /e "db\main" "%RELEASE_DIR%\db\main\"

echo ==================================================
echo [BUILD] Creating final release archive...
tar -czvf release.tar.gz -C %RELEASE_DIR% .

echo ==================================================
echo [DEPLOY] Uploading release to server...
echo Uploading release.tar.gz to 43.139.94.61:/release/
scp -i "C:\Code\keys\tencent_ind_web_sever.pem" release.tar.gz root@43.139.94.61:/release/

rmdir /s /q "%RELEASE_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo [DEPLOY] Upload completed successfully!
) else (
    echo [DEPLOY] Upload failed with error code %ERRORLEVEL%
    echo Please check your SSH key and server connectivity.
)

echo ==================================================
echo Build and deployment process completed!
echo Final release artifact 'release.tar.gz' has been created and uploaded.
echo ==================================================
echo ==================================================

endlocal