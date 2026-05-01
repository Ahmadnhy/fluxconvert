# ⚠️ ACTION REQUIRED: Apply Database Migration

## Current Status

✅ **Code Changes**: RLS policies have been updated in `supabase/schema.sql`
✅ **Storage Policies**: Already configured correctly (tests passing)
❌ **Database Migration**: **NOT YET APPLIED** - requires manual action

## Test Results

The bug condition exploration tests confirm:
- ❌ Database INSERT operations are **FAILING** with error code `42501` (RLS policy violation)
- ✅ Storage bucket uploads are **PASSING** (policies already configured)

## What You Need to Do

You must apply the database migration to your Supabase project. Choose one of the options below:

### Option 1: Supabase Dashboard (Easiest)

1. Open your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;

-- Recreate files INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Recreate conversions INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));
```

5. Click **Run** (or press Ctrl+Enter)
6. Verify you see "Success. No rows returned" message

### Option 2: Supabase CLI

If you have Supabase CLI configured with your project:

```bash
# Apply the migration file
npx supabase db push
```

## After Applying the Migration

Run the tests again to verify the fix:

```bash
# Run bug condition exploration test
npm test src/lib/database/files.test.ts

# Run preservation property tests
npm test src/lib/database/preservation.properties.test.ts
```

**Expected Results:**
- ✅ All bug condition tests should PASS
- ✅ All preservation tests should PASS

## Manual Testing

After the migration, test the full flow:

1. Open http://localhost:3000/word-to-pdf (without logging in)
2. Upload a .docx file
3. Click "Convert to PDF"
4. Verify the conversion succeeds and you can download the PDF

## What Changed

### Files Table RLS Policy
```sql
-- BEFORE
WITH CHECK (auth.uid() = user_id)

-- AFTER
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))
```

### Conversions Table RLS Policy
```sql
-- BEFORE
WITH CHECK (auth.uid() = user_id)

-- AFTER
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))
```

## Why This Change is Safe

- ✅ Anonymous users can only INSERT records with `user_id = NULL`
- ✅ Authenticated users continue to be restricted to their own files
- ✅ Anonymous users cannot view, update, or delete any records
- ✅ Storage paths remain segregated: `anonymous/*` vs `{user_id}/*`
- ✅ All preservation tests verify no regressions for authenticated users

## Need Help?

If you encounter any issues:
1. Check the Supabase dashboard for error messages
2. Verify your database connection is working
3. Ensure you have the necessary permissions to modify RLS policies
4. Review the full instructions in `supabase/MIGRATION_INSTRUCTIONS.md`
