# Supabase Migrations

This folder contains database migration files for the FluxConvert application.

## How to Apply Migrations

Since this project doesn't use the Supabase CLI, migrations are applied manually through the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the content from the migration file you want to apply
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

## Migration Files

### 001_add_status_to_files.sql

**Purpose**: Adds a `status` column to the `files` table to track whether files are active or deleted.

**Changes**:
- Adds `status` column with values 'active' or 'deleted'
- Sets default value to 'active'
- Creates index on `status` column
- Creates composite index on `created_at` and `status` for efficient cleanup queries

**Required for**: File cleanup job (Phase 4)

**To apply**:
```sql
-- Copy and paste the content from 001_add_status_to_files.sql into Supabase SQL Editor
```

### 002_create_rate_limits_table.sql (OPTIONAL)

**Purpose**: Creates a `rate_limits` table for persistent rate limiting tracking.

**Note**: This migration is **optional**. The application uses in-memory rate limiting by default for simplicity. Only apply this migration if you need persistent rate limiting across server restarts or distributed deployments.

**Changes**:
- Creates `rate_limits` table with identifier, endpoint, request_count, window_start
- Adds unique constraint on (identifier, endpoint)
- Creates indexes on identifier and window_start
- Creates composite index on (identifier, endpoint)
- Enables Row Level Security with service role access
- Adds trigger to update updated_at timestamp

**Use cases**:
- Distributed deployments (multiple server instances)
- Persistent rate limiting across server restarts
- Advanced rate limiting analytics

**To apply**:
```sql
-- Copy and paste the content from 002_create_rate_limits_table.sql into Supabase SQL Editor
```

## Verification

After applying a migration, verify it was successful:

1. Go to **Table Editor** in Supabase dashboard
2. Select the `files` table
3. Check that the `status` column exists
4. Go to **Database** > **Indexes**
5. Verify the new indexes are created

## Rollback

If you need to rollback a migration:

### For 001_add_status_to_files.sql:
```sql
-- Remove indexes
DROP INDEX IF EXISTS public.idx_files_status;
DROP INDEX IF EXISTS public.idx_files_created_at_status;

-- Remove column
ALTER TABLE public.files DROP COLUMN IF EXISTS status;
```

### For 002_create_rate_limits_table.sql:
```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_rate_limit_updated ON public.rate_limits;

-- Drop function
DROP FUNCTION IF EXISTS public.update_rate_limit_timestamp();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_rate_limits_identifier;
DROP INDEX IF EXISTS public.idx_rate_limits_window_start;
DROP INDEX IF EXISTS public.idx_rate_limits_identifier_endpoint;

-- Drop table
DROP TABLE IF EXISTS public.rate_limits;
```

## Storage Setup (Tasks 7.1 and 7.2)

### Task 7.1: Create Storage Buckets

Storage buckets must be created through the Supabase Dashboard UI (not via SQL).

**Documentation**:
- **Detailed Guide**: `supabase/STORAGE_BUCKETS_SETUP.md`
- **Quick Reference**: `supabase/STORAGE_BUCKETS_QUICK_REFERENCE.md`
- **Summary**: `supabase/migrations/TASK_7.1_SUMMARY.md`

**Buckets to create**:
1. `uploads` - Private, 50 MB limit, 5 MIME types
2. `converted` - Private, 100 MB limit, 4 MIME types

### Task 7.2: Configure Storage Policies

Storage policies control access to the storage buckets and must be created via SQL Editor.

**Documentation**:
- **Detailed Guide**: `supabase/STORAGE_POLICIES_SETUP.md`
- **Quick Reference**: `supabase/STORAGE_POLICIES_QUICK_REFERENCE.md`
- **Summary**: `supabase/migrations/TASK_7.2_SUMMARY.md`

**Quick Setup**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the complete SQL script from `supabase/STORAGE_POLICIES_QUICK_REFERENCE.md`
3. Paste and run the script
4. Verify 6 policies are created

**Policies created**:
- Users can upload their own files (uploads bucket)
- Users can read their own uploaded files (uploads bucket)
- Users can delete their own uploaded files (uploads bucket)
- Users can read their converted files (converted bucket)
- Service can write converted files (converted bucket)
- Users can delete their converted files (converted bucket)

## Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- Migrations are designed to be idempotent (safe to run multiple times)
- The main `schema.sql` file has been updated to include all migrations for new setups
- Storage buckets and policies must be configured manually through Supabase Dashboard
