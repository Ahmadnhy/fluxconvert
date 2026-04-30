# Kartu Referensi Cepat Storage Policy

**Task 7.2** - Referensi cepat untuk membuat storage policy Supabase

---

## Script SQL Lengkap (Copy & Jalankan)

```sql
-- ============================================================================
-- FluxConvert Storage Policies - Script Lengkap
-- ============================================================================

-- POLICY BUCKET UPLOADS

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

-- POLICY BUCKET CONVERTED

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

## Query Verifikasi

```sql
-- Lihat semua storage policy
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

**Yang Diharapkan: 6 policy**

---

## Hapus Policy (Jika Diperlukan)

```sql
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their converted files" ON storage.objects;
DROP POLICY IF EXISTS "Service can write converted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their converted files" ON storage.objects;
```

---

## Ringkasan Policy

| Bucket | Operasi | Siapa | Tujuan |
|--------|---------|-----|---------|
| uploads | INSERT | authenticated | User upload file input |
| uploads | SELECT | authenticated | User download file mereka |
| uploads | DELETE | authenticated | User hapus file mereka |
| converted | SELECT | authenticated | User download file converted |
| converted | INSERT | authenticated | Service tulis file converted |
| converted | DELETE | authenticated | User hapus file converted |

---

## Langkah Cepat

1. **Supabase Dashboard** → **SQL Editor**
2. Copy script SQL lengkap di atas
3. Paste ke SQL Editor
4. Klik **Run** atau tekan `Ctrl+Enter`
5. Jalankan query verifikasi untuk konfirmasi 6 policy dibuat
6. Selesai! ✅

---

## Format Path File

```
uploads/{user-id}/{filename}
converted/{user-id}/{filename}
```

**Contoh:**
```
uploads/123e4567-e89b-12d3-a456-426614174000/document.docx
converted/123e4567-e89b-12d3-a456-426614174000/document.pdf
```

---

## Masalah Umum

**"Policy already exists"**
→ Jalankan script hapus policy terlebih dahulu, lalu buat ulang

**"Permission denied" saat upload**
→ Cek user sudah terautentikasi dan format path sudah benar

**Policy dibuat tapi masih error**
→ Verifikasi nama bucket persis 'uploads' dan 'converted'

---

## Testing

```javascript
// Test upload (harus berhasil)
await supabase.storage
  .from('uploads')
  .upload(`${userId}/test.txt`, file);

// Test download (harus berhasil)
await supabase.storage
  .from('uploads')
  .download(`${userId}/test.txt`);

// Test akses file user lain (harus gagal)
await supabase.storage
  .from('uploads')
  .download(`other-user-id/test.txt`);
```

---

**Panduan Lengkap**: Lihat `supabase/STORAGE_POLICIES_SETUP_ID.md`  
**Requirements**: 6.1, 6.2, 6.3  
**Task Selanjutnya**: 8.1-8.4 (Fungsi utility storage)
