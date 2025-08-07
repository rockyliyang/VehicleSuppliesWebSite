#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
RELEASE_DIR="release"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
BACKEND_ARCHIVE_NAME="backend.tar.gz"

# --- Functions ---
echo_color() {
    case "$1" in
        "green") echo -e "\033[32m$2\033[0m" ;;
        "red") echo -e "\033[31m$2\033[0m" ;;
        "yellow") echo -e "\033[33m$2\033[0m" ;;
        *)
    esac
}

# --- Main Script ---

# 1. Clean up previous release directory
echo_color "yellow" "[BUILD] Cleaning up previous release directory..."
rm -rf $RELEASE_DIR
mkdir -p $RELEASE_DIR

# 2. Build Frontend
echo_color "green" "[BUILD] Starting frontend build..."
cd $FRONTEND_DIR
npm install
npm run build
cd ..

# 3. Move frontend build to release directory
echo_color "green" "[BUILD] Moving frontend assets to release directory..."
mv $FRONTEND_DIR/dist $RELEASE_DIR/frontend_dist

# 4. Package Backend
echo_color "green" "[BUILD] Packaging backend application..."
# Create a tarball of the backend, excluding node_modules and other unnecessary files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.DS_Store' \
    -czvf $RELEASE_DIR/$BACKEND_ARCHIVE_NAME \
    -C $BACKEND_DIR . 

# 5. Copy database migration scripts
echo_color "green" "[BUILD] Copying database scripts..."
mkdir -p $RELEASE_DIR/db
cp -r db/main $RELEASE_DIR/db/

# 6. Create final release archive
echo_color "green" "[BUILD] Creating final release archive..."
tar -czvf release.tar.gz -C $RELEASE_DIR .

# 7. Clean up temporary release directory
echo_color "yellow" "[BUILD] Cleaning up temporary release directory..."
rm -rf $RELEASE_DIR

echo_color "yellow" "=================================================="
echo_color "green"  "Build process completed successfully!"
echo_color "yellow" "Final release artifact 'release.tar.gz' has been created."
echo_color "yellow" "=================================================="