# GSFIN Docker Deployment Guide

This guide describes how to run and manage the **GSFIN** platform in a production containerized environment using Docker & Docker Compose.

---

## 1. Storage & Volume Separation Architecture

The platform architecture strictly isolates storage into dedicated persistent Docker volumes:

| Volume Name | Purpose | Container Path | Persistence |
| :--- | :--- | :--- | :--- |
| **`gsfin_mysql_data`** | MySQL 8.0 raw database storage | `/var/lib/mysql` | Survives container rebuilds & updates |
| **`gsfin_uploads_data`** | Certificates, PDF files, candidate documents, proctoring media | `/app/uploads` | Shared between backend (read-write) and Nginx (read-only) |
| **`gsfin_redis_data`** | Redis append-only persistence | `/data` | Fast cache & session persistence |
| **`gsfin_nginx_logs`** | Web server access & error logs | `/var/log/nginx` | External audit & monitoring |

---

## 2. Quick Start Deployment

### Step 1: Clone or Copy Repository to Server
```bash
git clone <repo-url> gsfin
cd gsfin
```

### Step 2: Configure Environment Variables
Copy the production environment template and configure your secrets:
```bash
cp .env.docker.example .env
```
Edit `.env` to set:
- `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- `FRONTEND_URL` and `APP_URL` (your domain or public IP)
- `RESEND_API_KEY` (for transaction & notification emails)

### Step 3: Build & Launch Services
```bash
docker compose up -d --build
```

### Step 4: Verify Container Health
```bash
docker compose ps
```
You should see all 5 containers in a healthy/running state:
- `gsfin_mysql` (Healthy)
- `gsfin_redis` (Healthy)
- `gsfin_backend` (Running, migrations executed automatically)
- `gsfin_frontend` (Running)
- `gsfin_nginx` (Listening on port 80/443)

---

## 3. Operations & Maintenance

### View Live Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

### Backup Database
```bash
docker compose exec mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" gsfin_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
docker compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" gsfin_db < backup_file.sql
```

### Backup Uploaded Files & Certificates
```bash
# Archive all uploads from the dedicated volume
docker run --rm -v gsfin_uploads_data:/uploads -v $(pwd):/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d).tar.gz -C /uploads .
```

### Stop / Restart Services
```bash
# Stop containers without deleting volumes
docker compose down

# Rebuild and restart after code changes
docker compose up -d --build
```
