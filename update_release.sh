#!/bin/bash
# Script to deploy the application from a release.tar.gz archive.
# Usage: sudo ./update_release.sh [--frontend|--backend|--all]
#
# Features:
# - Backs up and restores all environment configuration files (.env, .env.development, .env.production, etc.)
# - Preserves public directory during backend deployment
# - Provides warnings for missing critical environment files

# --- Configuration ---
DEPLOY_USER="web_deployer"
USER_HOME="/home/${DEPLOY_USER}"
FRONTEND_DIR="${USER_HOME}/frontend"
BACKEND_DIR="${USER_HOME}/backend"
RELEASE_ARCHIVE="release.tar.gz"

# --- Helper Functions ---
echo_color() {
    local color=$1
    local text=$2
    case ${color} in
        "green") echo -e "\033[0;32m${text}\033[0m" ;;
        "yellow") echo -e "\033[0;33m${text}\033[0m" ;;
        "red") echo -e "\033[0;31m${text}\033[0m" ;;
        *)
            echo "${text}"
    esac
}

# --- Pre-flight Checks ---
# 1. Check for root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo_color "red" "Error: This script must be run with sudo."
    exit 1
fi

# 2. Check for release archive
if [ ! -f "${RELEASE_ARCHIVE}" ]; then
    echo_color "red" "Error: Release archive '${RELEASE_ARCHIVE}' not found."
    exit 1
fi

# 3. Check for deploy user
if ! id "${DEPLOY_USER}" &>/dev/null; then
    echo_color "red" "Error: Deploy user '${DEPLOY_USER}' does not exist. Please run 'create_deploy_user.sh' first."
    exit 1
fi

# --- Deployment Functions ---

deploy_backend() {
    echo_color "yellow" "--- Deploying Backend ---"
    
    # Stop backend service
    echo_color "green" "[BACKEND] Stopping backend service (pm2)..."
    sudo -u ${DEPLOY_USER} pm2 stop vehicle-supplies-backend || echo "Backend not running, proceeding..."
    sudo -u ${DEPLOY_USER} pm2 stop vehicle-supplies-scheduler || echo "Scheduler not running, proceeding..."

    # Backup environment configuration files if they exist
    echo_color "green" "[BACKEND] Backing up environment configuration files..."
    ENV_BACKUP_DIR=""
    ENV_FILES=(".env" ".env.development" ".env.production" ".env.local" ".env.development.local" ".env.production.local")
    
    # Check if any env files exist
    ENV_FILES_EXIST=false
    for env_file in "${ENV_FILES[@]}"; do
        if [ -f "${BACKEND_DIR}/${env_file}" ]; then
            ENV_FILES_EXIST=true
            break
        fi
    done
    
    if [ "${ENV_FILES_EXIST}" = true ]; then
        ENV_BACKUP_DIR=$(mktemp -d)
        for env_file in "${ENV_FILES[@]}"; do
            if [ -f "${BACKEND_DIR}/${env_file}" ]; then
                cp "${BACKEND_DIR}/${env_file}" "${ENV_BACKUP_DIR}/"
                echo_color "green" "[BACKEND] ${env_file} backed up to ${ENV_BACKUP_DIR}"
            fi
        done
    fi

    # Backup public directory if it exists
    echo_color "green" "[BACKEND] Backing up public directory..."
    PUBLIC_BACKUP_DIR=""
    if [ -d "${BACKEND_DIR}/public" ]; then
        PUBLIC_BACKUP_DIR=$(mktemp -d)
        cp -r ${BACKEND_DIR}/public/* ${PUBLIC_BACKUP_DIR}/ 2>/dev/null || echo "Public directory is empty or doesn't exist"
        echo_color "green" "[BACKEND] Public directory backed up to ${PUBLIC_BACKUP_DIR}"
    fi

    # Remove all files except public directory
    echo_color "green" "[BACKEND] Removing old backend files (preserving public directory)..."
    find ${BACKEND_DIR} -mindepth 1 -maxdepth 1 ! -name 'public' -exec rm -rf {} +

    # Unpack backend files
    echo_color "green" "[BACKEND] Unpacking backend files..."
    tar -xzvf release/backend.tar.gz -C ${BACKEND_DIR}

    # Restore environment configuration files if they were backed up
    if [ -n "${ENV_BACKUP_DIR}" ] && [ -d "${ENV_BACKUP_DIR}" ]; then
        echo_color "green" "[BACKEND] Restoring existing environment configuration files..."
        for env_file in "${ENV_FILES[@]}"; do
            if [ -f "${ENV_BACKUP_DIR}/${env_file}" ]; then
                cp "${ENV_BACKUP_DIR}/${env_file}" "${BACKEND_DIR}/"
                echo_color "green" "[BACKEND] ${env_file} restored"
            fi
        done
        rm -rf ${ENV_BACKUP_DIR}
        echo_color "green" "[BACKEND] Environment configuration files restored"
    else
        echo_color "yellow" "[BACKEND] No existing environment files found. Using files from release if available."
        # Check if any env files are missing and warn about them
        for env_file in ".env.development" ".env.production"; do
            if [ ! -f "${BACKEND_DIR}/${env_file}" ]; then
                echo_color "yellow" "[BACKEND] Warning: ${env_file} not found. Please ensure proper environment configuration."
            fi
        done
    fi

    # Restore public directory if it was backed up
    if [ -n "${PUBLIC_BACKUP_DIR}" ] && [ -d "${PUBLIC_BACKUP_DIR}" ]; then
        echo_color "green" "[BACKEND] Restoring public directory..."
        mkdir -p ${BACKEND_DIR}/public
        cp -r ${PUBLIC_BACKUP_DIR}/* ${BACKEND_DIR}/public/ 2>/dev/null || echo "No files to restore in public directory"
        rm -rf ${PUBLIC_BACKUP_DIR}
        echo_color "green" "[BACKEND] Public directory restored"
    fi

    # Install dependencies
    echo_color "green" "[BACKEND] Installing npm dependencies..."
    sudo -u ${DEPLOY_USER} bash -c "cd ${BACKEND_DIR} && npm install --production"

    # Set permissions
    echo_color "green" "[BACKEND] Setting permissions..."
    chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${BACKEND_DIR}
    chmod -R 750 ${BACKEND_DIR}

    # Restart backend service
    echo_color "green" "[BACKEND] Restarting backend service (pm2)..."
    sudo -u ${DEPLOY_USER} bash -c "cd ${BACKEND_DIR} && pm2 start ecosystem.config.js --env production"
    sudo -u ${DEPLOY_USER} pm2 save
}

deploy_frontend() {
    echo_color "yellow" "--- Deploying Frontend ---"

    # Unpack frontend files
    echo_color "green" "[FRONTEND] Unpacking frontend files..."
    rm -rf ${FRONTEND_DIR}/*
    cp -r release/frontend_dist/* ${FRONTEND_DIR}/

    # Set permissions
    echo_color "green" "[FRONTEND] Setting permissions..."
    chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${FRONTEND_DIR}
    chmod -R 750 ${FRONTEND_DIR}

    # Create symbolic link from frontend/static to backend/public/static
    echo_color "green" "[FRONTEND] Creating symbolic link to backend static files..."
    sudo -u ${DEPLOY_USER} bash -c "
        # Remove existing static link/directory if it exists
        if [ -L '${FRONTEND_DIR}/static' ] || [ -d '${FRONTEND_DIR}/static' ]; then
            rm -rf '${FRONTEND_DIR}/static'
        fi
        # Create symbolic link
        ln -s '${BACKEND_DIR}/public/static' '${FRONTEND_DIR}/static'
        echo 'Symbolic link created: ${FRONTEND_DIR}/static -> ${BACKEND_DIR}/public/static'
    "

    # Restart Nginx
    echo_color "green" "[FRONTEND] Restarting Nginx..."
    systemctl restart nginx
}

# --- Main Script ---

# Check and remove existing release directory
echo_color "green" "[DEPLOY] Checking for existing release directory..."
if [ -d "release" ]; then
    echo_color "yellow" "[DEPLOY] Removing existing release directory..."
    rm -rf release
fi

# Create release directory and extract archive
echo_color "green" "[DEPLOY] Creating release directory and extracting archive..."
mkdir -p release
tar -xzvf ${RELEASE_ARCHIVE} -C release

RESTART_FRONTEND=false
RESTART_BACKEND=false

if [ "$1" == "--frontend" ]; then
    RESTART_FRONTEND=true
elif [ "$1" == "--backend" ]; then
    RESTART_BACKEND=true
elif [ "$1" == "--all" ] || [ -z "$1" ]; then
    RESTART_FRONTEND=true
    RESTART_BACKEND=true
else
    echo_color "red" "Invalid argument. Use --frontend, --backend, or --all."
    rm -rf ${TEMP_DIR}
    exit 1
fi

if [ "${RESTART_BACKEND}" = true ]; then
    deploy_backend
fi

if [ "${RESTART_FRONTEND}" = true ]; then
    deploy_frontend
fi

# Execute database update script if it exists
echo_color "yellow" "--- Updating Database ---"
if [ -f "release/update_database.sh" ]; then
    echo_color "green" "[DATABASE] Found database update script, executing..."
    chmod +x release/update_database.sh
    cd release
    ./update_database.sh
    cd ..
    if [ $? -eq 0 ]; then
        echo_color "green" "[DATABASE] Database update completed successfully"
    else
        echo_color "red" "[DATABASE] Database update failed with error code $?"
    fi
else
    echo_color "yellow" "[DATABASE] No database update script found, skipping database update"
fi

echo_color "yellow" "=================================================="
echo_color "green" "Deployment completed successfully!"
echo_color "yellow" "Note: Release directory preserved for database script execution."
echo_color "yellow" "=================================================="