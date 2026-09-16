# syntax=docker/dockerfile:1

# ── Stage 1: Build Nuxt 3 Standalone Bundle ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy shared workspace module
WORKDIR /shared
COPY shared/package*.json ./
COPY shared/ ./
RUN npm install

# Build frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Build arguments for compile-time environment variables
ARG NUXT_PUBLIC_API_BASE=/api
ARG RAZORPAY_KEY_ID=

ENV NODE_ENV=production \
    NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE} \
    RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID} \
    NITRO_PRESET=node-server

RUN npm run build

# ── Stage 2: Production Runner ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy only the compiled standalone Nitro bundle from builder stage
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
