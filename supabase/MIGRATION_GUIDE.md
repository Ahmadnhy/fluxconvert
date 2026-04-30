# Migration Guide: Adding Status Field to Files Table

This guide will walk you through applying the migration to add a `status` field to the `files` table.

## What This Migration Does

This migration adds a `status` column to the `files` table that will be used to track whether files are active or have been marked for deletion. This is required for the automated file cleanup job that will run daily to remove old files.

**Changes**:
- Adds `status` column (values: 'active' or 'deleted')
- Sets default value to 'active' for all existing and new files
- Creates index on `status` for efficient filtering
- Creates composite index on `created_at` and `status` for cleanup queries

## Prerequisites

- Access to your Supabase project dashboard
- The `files` table must already exist (created from the initial schema.sql)

## Step-by-Step Instructions

### Option 1: Apply Migration File (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your FluxConvert project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy Migration SQL**
   - Open the file `supabase/migrations/001_add_status_to_files.sql`
   - Copy the entire content

4. **Paste and Execute**
   - Paste the SQL into the query editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

5. **Verify Success**
   - You should see a success message
   - The query should complete without errors

### Option 2: Manual SQL Commands

If you prefer to run the commands manually, execute these in the SQL Editor:

```sql
-- Add status column with check constraint
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'deleted'));

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);

-- Create composite index on created_at and status for cleanup job queries
CREATE INDEX IF NOT EXISTS idx_files_created_at_status ON public.files(created_at DESC, status);

-- Add comment to document the column
COMMENT ON COLUMN public.files.status IS 'File status: active (available) or deleted (marked for cleanup)';
```

## Verification

After applying the migration, verify it was successful:

### 1. Check the Column Exists

Go to **Table Editor** > **files** table and verify:
- A new column named `status` exists
- The default value is 'active'
- Existing rows (if any) have `status` set to 'active'

### 2. Check the Indexes

Go to **Database** > **Indexes** and verify these indexes exist:
- `idx_files_status`
- `idx_files_created_at_status`

### 3. Test the Constraint

Try running this query in SQL Editor (it should fail):
```sql
INSERT INTO public.files (file_name, file_type, file_size, storage_path, storage_bucket, status)
VALUES ('test.pdf', 'application/pdf', 1024, '/test/test.pdf', 'uploads', 'invalid');
```

Expected result: Error message about constraint violation (this is good!)

### 4. Test Valid Values

Try running this query (it should succeed):
```sql
-- This should work
SELECT 'active'::TEXT IN ('active', 'deleted') as is_valid;
-- Result should be: true
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS public.idx_files_status;
DROP INDEX IF EXISTS public.idx_files_created_at_status;

-- Remove column
ALTER TABLE public.files DROP COLUMN IF EXISTS status;
```

**Warning**: Only rollback if absolutely necessary. This will remove the `status` column and all its data.

## Impact on Existing Data

- **Existing files**: All existing file records will automatically have `status` set to 'active'
- **New files**: All new file records will default to 'active' unless explicitly set
- **No data loss**: This migration is additive and doesn't modify or delete existing data

## Next Steps

After successfully applying this migration:

1. ✅ The `files` table now has a `status` column
2. ✅ Indexes are in place for efficient queries
3. ✅ Ready for Phase 2 implementation (storage integration)
4. ✅ Ready for Phase 4 implementation (file cleanup job)

## Troubleshooting

### Error: "column already exists"

This is safe to ignore. The migration uses `IF NOT EXISTS` to prevent errors if the column already exists.

### Error: "permission denied"

Make sure you're logged in as the project owner or have sufficient permissions to modify the database schema.

### Error: "relation does not exist"

The `files` table doesn't exist yet. Run the initial `schema.sql` first to create all tables.

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify you have the correct permissions
3. Ensure the `files` table exists
4. Review the error message carefully

## Migration Status

- [x] Migration file created: `001_add_status_to_files.sql`
- [x] Main schema updated: `schema.sql`
- [ ] Migration applied to development database
- [ ] Migration applied to production database
- [ ] Verification completed

Mark the checkboxes above as you complete each step.
