# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Install native dependencies if needed (e.g., build tools, canvas dependencies)
RUN apk add --no-cache libc6-compat netcat-openbsd

# Copy shared workspace package first
WORKDIR /shared
COPY shared/package*.json ./
COPY shared/ ./
RUN npm install --omit=dev --legacy-peer-deps

# Setup backend workspace
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source code and entrypoint
COPY backend/ ./
RUN chmod +x ./docker-entrypoint.sh

# Environment defaults
ENV NODE_ENV=production \
    PORT=5000

# Expose backend port
EXPOSE 5000

# Set entrypoint and default command
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/app.js"]
