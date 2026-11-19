#!/usr/bin/env bash
# ==============================================================================
# GSFIN - Automated Production Docker Deployment & Update Script
# Domain: https://gsfin.uk
# ==============================================================================
set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}       GSFIN Production Server Update (gsfin.uk)     ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check prerequisite tools
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose plugin (docker compose) is not installed.${NC}"
    exit 1
fi

# 2. Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}[!] .env not found. Creating from .env.docker.example...${NC}"
    cp .env.docker.example .env
    echo -e "${YELLOW}[!] Please review and edit your .env passwords and secrets if needed.${NC}"
fi

# 3. Pull latest changes from Git
echo -e "\n${BLUE}[1/5] Fetching and pulling latest code from origin/main...${NC}"
git fetch origin main
git pull origin main

# 4. Optional: Quick Database backup before restart
if docker ps -q -f name=gsfin_mysql | grep -q .; then
    echo -e "\n${BLUE}[2/5] Creating safe backup of current database...${NC}"
    mkdir -p backups
    BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    docker compose exec -T mysql mysqldump -u root -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)" gsfin_db > "$BACKUP_FILE" 2>/dev/null || true
    if [ -s "$BACKUP_FILE" ]; then
        echo -e "${GREEN}[OK] Database backed up to ${BACKUP_FILE}${NC}"
    fi
fi

# 5. Build and launch updated containers
echo -e "\n${BLUE}[3/5] Building and launching containers in detached mode...${NC}"
docker compose up -d --build --remove-orphans

# 6. Clean dangling unused images to save disk space
echo -e "\n${BLUE}[4/5] Cleaning old dangling container images...${NC}"
docker image prune -f

# 7. Check service health
echo -e "\n${BLUE}[5/5] Checking container status...${NC}"
sleep 3
docker compose ps

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ Deployment & Update Complete!                     ${NC}"
echo -e "${GREEN}  Domain: https://gsfin.uk                             ${NC}"
echo -e "${GREEN}  API:    https://gsfin.uk/api                         ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "To view live logs, run: ${YELLOW}docker compose logs -f${NC}\n"
