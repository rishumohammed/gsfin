#!/usr/bin/env bash
# ==============================================================================
# GSFIN - Automated Free Let's Encrypt SSL Setup for gsfin.uk
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="gsfin.uk"
EMAIL="admin@gsfin.uk"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}    GSFIN Automated SSL Setup for ${DOMAIN}           ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run as root (or use sudo).${NC}"
  exit 1
fi

# 1. Install Certbot if missing
if ! command -v certbot &> /dev/null; then
    echo -e "\n${BLUE}[1/4] Installing Certbot...${NC}"
    apt-get update
    apt-get install -y certbot
else
    echo -e "\n${GREEN}[1/4] Certbot is already installed.${NC}"
fi

# 2. Stop Nginx container temporarily to free port 80 for ACME challenge
echo -e "\n${BLUE}[2/4] Temporarily stopping Nginx container for certificate issuance...${NC}"
docker compose stop nginx 2>/dev/null || true

# 3. Request certificate via standalone mode
echo -e "\n${BLUE}[3/4] Requesting Let's Encrypt SSL certificate for ${DOMAIN} & www.${DOMAIN}...${NC}"
certbot certonly --standalone \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --expand || {
        echo -e "${RED}[ERROR] Failed to obtain SSL certificate.${NC}"
        echo -e "${YELLOW}Please ensure your DNS A-records for ${DOMAIN} and www.${DOMAIN} point to this server's public IP address!${NC}"
        docker compose start nginx 2>/dev/null || true
        exit 1
    }

# 4. Activate SSL Nginx configuration
echo -e "\n${BLUE}[4/4] Activating HTTPS Nginx configuration...${NC}"
cp nginx/default-ssl.conf nginx/default.conf

# Rebuild and restart Nginx with SSL enabled
docker compose up -d --build nginx

# Setup automatic renewal cron job if not already present
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo -e "\n${BLUE}Configuring automatic certificate renewal cron...${NC}"
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --pre-hook 'docker compose stop nginx' --post-hook 'docker compose start nginx' --quiet") | crontab -
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ SSL Setup Complete!                               ${NC}"
echo -e "${GREEN}  Your website is now secure at:                      ${NC}"
echo -e "${GREEN}  https://${DOMAIN}                                   ${NC}"
echo -e "${GREEN}  https://www.${DOMAIN}                               ${NC}"
echo -e "${GREEN}======================================================${NC}\n"
