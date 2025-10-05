# Database Setup Quick Reference

## Automatic Setup (Recommended)

The application **automatically creates tables** when it starts! 🎉

Just run:
```bash
npm start
```

The app will:
1. Test database connection
2. Create `urls` table if it doesn't exist
3. Create indexes
4. Create triggers
5. Start the server

## Manual Migration (If Needed)

If you want to run migrations manually:

```bash
# Using the migration script
npm run migrate

# Or using ts-node directly
npx ts-node src/database/migrate.ts

# Or using psql
psql -U postgres -d url_shortener < schema.sql
```

## Database Schema

### `urls` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `short_code` | VARCHAR(20) | Unique short code (indexed) |
| `original_url` | TEXT | The original long URL |
| `created_at` | TIMESTAMP | When the URL was created (indexed) |
| `updated_at` | TIMESTAMP | Last update time (auto-updated) |
| `clicks` | INTEGER | Number of times accessed |
| `metadata` | JSONB | Additional metadata |

### Indexes

- `idx_urls_short_code` on `short_code` - Fast lookups
- `idx_urls_created_at` on `created_at` - Analytics queries

### Triggers

- `update_urls_updated_at` - Automatically updates `updated_at` on modifications

## Environment-Specific Databases

### Development
```bash
DB_NAME=url_shortener
```

### Staging
```bash
DB_NAME=url_shortener_staging
```

### Production
```bash
DB_NAME=url_shortener
```

## Verify Database Setup

```bash
# Connect to database
psql -U postgres -d url_shortener

# Check tables
\dt

# Check table structure
\d urls

# Check indexes
\di

# Exit
\q
```

## Railway Deployment

**No manual setup needed!**

When you deploy to Railway:
1. Railway creates PostgreSQL database automatically
2. App starts and runs migrations automatically
3. Tables are created on first startup

Just make sure these environment variables are set in Railway:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## Troubleshooting

### "relation 'urls' does not exist"

The app should auto-create tables. If you see this error:

```bash
# Run migrations manually
npm run migrate

# Or restart the app (it will create tables)
npm start
```

### "permission denied for schema public"

Your database user needs permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE url_shortener TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
```

### Check if tables exist

```bash
psql -U postgres -d url_shortener -c "\dt"
```

## Backup & Restore

### Backup
```bash
pg_dump -U postgres url_shortener > backup.sql
```

### Restore
```bash
psql -U postgres url_shortener < backup.sql
```

## See Also

- [DATABASE.md](./DATABASE.md) - Comprehensive database guide
- [STAGING.md](./STAGING.md) - Staging environment setup
- [README.md](./README.md) - Main documentation
