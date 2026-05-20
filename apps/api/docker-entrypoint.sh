#!/bin/sh
set -eu

# docker-compose's depends_on { condition: service_healthy } already
# blocks this container until postgres is reachable, so we don't need a
# bespoke wait loop here — running `prisma migrate deploy` first will
# fail loudly with a useful error if the DB is actually unreachable.

echo "[entrypoint] applying migrations"
node node_modules/prisma/build/index.js migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "[entrypoint] running seed"
    node dist/prisma/seed.js
fi

echo "[entrypoint] starting api"
exec node dist/main.js
