# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production \
    CI=true

COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund --include=dev

COPY . .

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl tini \
    && rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R a+rX /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nginx", "-g", "daemon off;"]
