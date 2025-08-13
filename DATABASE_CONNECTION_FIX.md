# Database Connection Troubleshooting

## Issue
The application is unable to connect to the Supabase PostgreSQL database with the error:
```
Can't reach database server at `kbmylpvwbxdgnolbbini.supabase.co:5432`
```

## Solution Steps

1. Go to your Supabase dashboard (https://app.supabase.com)
2. Navigate to Project Settings > Database
3. Find the "Connection Pooling" section
4. Copy the correct connection string format

### Direct Connection (for migrations and schema changes)
Look for the "Connection string" or "URI" that looks like:
```
postgresql://postgres:[PASSWORD]@db.kbmylpvwbxdgnolbbini.supabase.co:5432/postgres
```

### Connection Pooling (for production applications)
Look for the connection string that looks like:
```
postgresql://postgres:[PASSWORD]@db.kbmylpvwbxdgnolbbini.supabase.co:6543/postgres?pgbouncer=true
```

## Updating your .env file

Update your `.env` file with the following format:

```properties
# Direct Connection (for migrations)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.kbmylpvwbxdgnolbbini.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.kbmylpvwbxdgnolbbini.supabase.co:5432/postgres"
```

Make sure to:
1. Replace `[YOUR_PASSWORD]` with your actual Supabase PostgreSQL password
2. Verify the hostname includes `db.` prefix (db.kbmylpvwbxdgnolbbini.supabase.co)
3. Use port 5432 for direct connections
4. Use the format `postgresql://` (not `postgres://`)

## Verify Connection
After updating the connection strings, run:
```bash
npx prisma validate
npx prisma db pull
```

If successful, generate your Prisma client:
```bash
npx prisma generate
```
