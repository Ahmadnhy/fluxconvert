# Migration Instructions: Allow Anonymous User Uploads

## Overview
This migration fixes the RLS policy violation that prevents anonymous users from uploading files for Word to PDF conversion.

## Database Migration (Required)

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20240101000000_allow_anonymous_uploads.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration
6. Verify no errors are shown

### Option 2: Using Supabase CLI

If you have Supabase CLI configured with your project:

```bash
npx supabase db push
```

Or apply the specific migration:

```bash
npx supabase migration up
```

## Storage Bucket Policies (Required)

### Important Note
Based on the bug exploration test results, you need to verify and configure storage bucket policies for anonymous uploads.

### For `uploads` Bucket

1. Open Supabase Dashboard → **Storage** → `uploads` bucket → **Policies**
2. Click **New Policy**
3. Configure the policy:
   - **Policy Name**: "Allow anonymous uploads to anonymous folder"
   - **Allowed Operation**: INSERT
   - **Policy Definition**:
     ```sql
     bucket_id = 'uploads' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
     ```
4. Click **Save**

### For `converted` Bucket

1. Open Supabase Dashboard → **Storage** → `converted` bucket → **Policies**
2. Click **New Policy**
3. Configure the policy:
   - **Policy Name**: "Allow anonymous uploads to anonymous folder"
   - **Allowed Operation**: INSERT
   - **Policy Definition**:
     ```sql
     bucket_id = 'converted' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
     ```
4. Click **Save**

## Verification

After applying the migration and storage policies:

1. Run the bug condition exploration test:
   ```bash
   npm test src/lib/database/files.test.ts
   ```
   
2. Run the preservation property tests:
   ```bash
   npm test src/lib/database/preservation.properties.test.ts
   ```

3. Test manually:
   - Navigate to http://localhost:3000/word-to-pdf (without logging in)
   - Upload a .docx file
   - Click "Convert to PDF"
   - Verify the conversion succeeds and you can download the PDF

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Drop the modified policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;

-- Recreate original policies (authenticated users only)
CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

## What Changed

### Files Table RLS Policy
- **Before**: `WITH CHECK (auth.uid() = user_id)`
- **After**: `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`

### Conversions Table RLS Policy
- **Before**: `WITH CHECK (auth.uid() = user_id)`
- **After**: `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`

### Storage Bucket Policies
- Added INSERT policies for both `uploads` and `converted` buckets
- Allow anonymous users to upload to `anonymous/*` paths
- Authenticated users continue to upload to `{user_id}/*` paths

## Security Considerations

- Anonymous users can only INSERT records with `user_id = NULL`
- Anonymous users cannot view, update, or delete any records (including their own)
- Authenticated users continue to be restricted to their own files
- File cleanup is handled by the cron job for both anonymous and authenticated files
- Storage paths are segregated: `anonymous/*` vs `{user_id}/*`
