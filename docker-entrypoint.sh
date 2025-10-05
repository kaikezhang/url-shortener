#!/bin/sh
set -e

echo "🔍 Checking database connection..."

# Wait for PostgreSQL to be ready
until node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
pool.query('SELECT 1')
  .then(() => { pool.end(); process.exit(0); })
  .catch((err) => { console.error('Database not ready:', err.message); process.exit(1); });
" 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ Database is ready"

# Run migrations if SKIP_MIGRATIONS is not set
if [ -z "$SKIP_MIGRATIONS" ]; then
  echo "🚀 Running database migrations..."
  npm run migrate:up || {
    echo "❌ Migration failed!"
    exit 1
  }
  echo "✅ Migrations completed"
else
  echo "⚠️  Skipping migrations (SKIP_MIGRATIONS is set)"
fi

# Start the application
echo "🎯 Starting application..."
exec "$@"
