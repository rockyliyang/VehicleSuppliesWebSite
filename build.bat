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
call npm run build
cd ..

:: 3. Move frontend build to release directory
echo [BUILD] Moving frontend assets to release directory...
move "%FRONTEND_DIR%\dist" "%RELEASE_DIR%\frontend_dist"

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

rem 7. Clean up temporary release directory
rmdir /s /q %RELEASE_DIR%

echo ==================================================
echo Build process completed successfully!
echo Final release artifact 'release.tar.gz' has been created.
echo ==================================================
echo ==================================================

endlocal