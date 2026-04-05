#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait for postgres with retry loop (handles slow starts)
MAX_TRIES=30
COUNT=0
until node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "❌ Could not connect to PostgreSQL after $MAX_TRIES attempts. Exiting."
    exit 1
  fi
  echo "  Attempt $COUNT/$MAX_TRIES — retrying in 2s..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "📦 Running Prisma schema push..."
npx prisma db push --accept-data-loss

echo "🚀 Starting application..."
exec node src/index.js
