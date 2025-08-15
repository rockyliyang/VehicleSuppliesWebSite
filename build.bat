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

:: 6. Handle patch files if they exist
echo [BUILD] Checking for patch files...
if exist "db\patch\*" (
    echo [BUILD] Found patch files, copying to release...
    mkdir "%RELEASE_DIR%\db\patch"
    xcopy /s /e "db\patch" "%RELEASE_DIR%\db\patch\"
    
    :: Create timestamped directory in patched folder
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do (
        set "dt=%%a"
        if defined dt (
            set "YY=!dt:~2,2!" & set "YYYY=!dt:~0,4!" & set "MM=!dt:~4,2!" & set "DD=!dt:~6,2!"
            set "HH=!dt:~8,2!" & set "Min=!dt:~10,2!" & set "Sec=!dt:~12,2!"
            set "timestamp=!YYYY!!MM!!DD!_!HH!!Min!!Sec!"
        )
    )
    
    echo [BUILD] Creating patched directory with timestamp: !timestamp!
    if not exist "db\patched" mkdir "db\patched"
    mkdir "db\patched\!timestamp!"
    
    :: Move patch files to timestamped directory
    echo [BUILD] Moving patch files to db\patched\!timestamp!...
    move "db\patch\*" "db\patched\!timestamp!\"
    
     echo [BUILD] Patch files processed successfully
) else (
    echo [BUILD] No patch files found, skipping patch processing
)

echo ==================================================
echo [BUILD] Creating final release archive...
tar -czvf release.tar.gz -C %RELEASE_DIR% .

:: Create released directory with timestamp and save release archive
echo [BUILD] Saving release archive to released directory...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do (
    set "dt=%%a"
    if defined dt (
        set "YY=!dt:~2,2!" & set "YYYY=!dt:~0,4!" & set "MM=!dt:~4,2!" & set "DD=!dt:~6,2!"
        set "HH=!dt:~8,2!" & set "Min=!dt:~10,2!" & set "Sec=!dt:~12,2!"
        set "timestamp=!YYYY!!MM!!DD!_!HH!!Min!!Sec!"
    )
)

if not exist "released" mkdir "released"
mkdir "released\!timestamp!"
copy "release.tar.gz" "released\!timestamp!\release_!timestamp!.tar.gz"
echo [BUILD] Release archive saved to released\!timestamp!\release_!timestamp!.tar.gz

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