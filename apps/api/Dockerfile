# syntax=docker/dockerfile:1.7

# ---------- Stage 1: deps + build ----------
FROM node:26-alpine AS builder

WORKDIR /app

# Prisma 5 needs OpenSSL on alpine to generate the engine.
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
        npm ci --no-audit --no-fund; \
    else \
        npm install --no-audit --no-fund; \
    fi

# Generate the Prisma client into node_modules/@prisma/client BEFORE tsc
# runs, otherwise the @prisma/client import would resolve to the stub.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:26-alpine AS runtime

RUN apk add --no-cache curl tini openssl

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev --no-audit --no-fund; \
    else \
        npm install --omit=dev --no-audit --no-fund; \
    fi

# Prisma schema is needed at runtime for `prisma migrate deploy`.
COPY prisma ./prisma

# Generated client + compiled JS.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R node:node /app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:4000/v1/health || exit 1

USER node
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

# ---------- Stage 3: test ----------
# Keeps devDeps + source + jest config so `docker compose run --rm
# api-test` can exec the test suite against the live postgres without
# bloating the production runtime image.
FROM builder AS test

WORKDIR /app

ENV NODE_ENV=test \
    CI=true

COPY test ./test
COPY jest.config.cjs tsconfig.test.json ./

# Tests run as root inside the container — fine for the throwaway
# test image, never used to serve traffic.
CMD ["npx", "jest", "--runInBand", "--forceExit"]
