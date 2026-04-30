# Storage Policies Quick Reference Card

**Task 7.2** - Quick reference for creating Supabase storage policies

---

## Complete SQL Script (Copy & Run)

```sql
-- ============================================================================
-- FluxConvert Storage Policies - Complete Script
-- ============================================================================

-- UPLOADS BUCKET POLICIES

CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own uploaded files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CONVERTED BUCKET POLICIES

CREATE POLICY "Users can read their converted files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service can write converted files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their converted files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Verification Query

```sql
-- View all storage policies
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

**Expected: 6 policies**

---

## Drop Policies (If Needed)

```sql
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their converted files" ON storage.objects;
DROP POLICY IF EXISTS "Service can write converted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their converted files" ON storage.objects;
```

---

## Policy Summary

| Bucket | Operation | Who | Purpose |
|--------|-----------|-----|---------|
| uploads | INSERT | authenticated | Users upload input files |
| uploads | SELECT | authenticated | Users download their files |
| uploads | DELETE | authenticated | Users delete their files |
| converted | SELECT | authenticated | Users download converted files |
| converted | INSERT | authenticated | Service writes converted files |
| converted | DELETE | authenticated | Users delete converted files |

---

## Quick Steps

1. **Supabase Dashboard** → **SQL Editor**
2. Copy the complete SQL script above
3. Paste into SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. Run verification query to confirm 6 policies created
6. Done! ✅

---

## File Path Format

```
uploads/{user-id}/{filename}
converted/{user-id}/{filename}
```

**Example:**
```
uploads/123e4567-e89b-12d3-a456-426614174000/document.docx
converted/123e4567-e89b-12d3-a456-426614174000/document.pdf
```

---

## Common Issues

**"Policy already exists"**
→ Run drop policies script first, then recreate

**"Permission denied" when uploading**
→ Check user is authenticated and path format is correct

**Policies created but still errors**
→ Verify bucket names are exactly 'uploads' and 'converted'

---

## Testing

```javascript
// Test upload (should succeed)
await supabase.storage
  .from('uploads')
  .upload(`${userId}/test.txt`, file);

// Test download (should succeed)
await supabase.storage
  .from('uploads')
  .download(`${userId}/test.txt`);

// Test access other user's file (should fail)
await supabase.storage
  .from('uploads')
  .download(`other-user-id/test.txt`);
```

---

**Full Guide**: See `supabase/STORAGE_POLICIES_SETUP.md`  
**Requirements**: 6.1, 6.2, 6.3  
**Next Task**: 8.1-8.4 (Storage utility functions)

