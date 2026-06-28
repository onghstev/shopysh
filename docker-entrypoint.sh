#!/bin/sh
set -e

echo "🚀 Starting Shopysh..."

# Run database migrations
echo "📦 Applying database migrations..."
if [ -f ./node_modules/prisma/build/index.js ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate 2>&1 || echo "⚠️ Migration warning (non-fatal)"
else
  echo "⚠️ Prisma CLI not found, skipping migrations"
fi

# Ensure uploads directory is writable (volume may be owned by root on first mount)
mkdir -p /app/public/uploads/products 2>/dev/null || true

# Verify server.js exists
if [ ! -f server.js ]; then
  echo "❌ server.js not found! Contents of /app:"
  ls -la
  exit 1
fi

echo "✅ Starting server on port ${PORT:-3000}"
exec node server.js
