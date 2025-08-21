# Database Schema Setup

This document explains how to set up the database schema for the e-commerce application.

## Prerequisites

1. Make sure you have access to your Supabase project
2. Have the database connection details ready (from your .env file)

## Setup Instructions

There are two ways to execute the schema:

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the schema

### Option 2: Using psql

If you have psql installed, you can run the schema directly:

```bash
# Using direct connection
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres" -f supabase-schema.sql

# Or using connection string from .env
psql "$DIRECT_URL" -f supabase-schema.sql
```

## Verification

After running the schema, you can verify the setup by:

1. Checking the tables in Supabase dashboard
2. Running a test query:
```sql
SELECT * FROM public.profile;
```

## Troubleshooting

If you encounter any errors:

1. Make sure you have the necessary permissions
2. Check if the tables already exist
3. Verify the connection details are correct
4. Look for any error messages in the Supabase logs

## Tables Created

The schema creates the following tables:

1. `public.profile`
   - Stores user profile information
   - Has Row Level Security (RLS) policies
   - Automatically creates profiles for new users

## Important Notes

1. The schema includes Row Level Security policies
2. Timestamps are automatically managed
3. UUIDs are used for primary keys
4. The schema is idempotent (safe to run multiple times)
