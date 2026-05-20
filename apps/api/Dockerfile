# syntax=docker/dockerfile:1.7

# ---------- Stage 1: deps + build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Phase 1 has no lockfile yet; fall back to npm install on first build.
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

RUN apk add --no-cache curl tini

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi

COPY --from=builder /app/dist ./dist

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:4000/v1/health || exit 1

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
