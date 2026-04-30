# Panduan Setup Storage Policy Supabase

Panduan ini memberikan instruksi langkah demi langkah untuk mengkonfigurasi policy Row Level Security (RLS) untuk storage bucket aplikasi FluxConvert. Policy ini mengontrol siapa yang bisa upload, baca, dan hapus file di bucket `uploads` dan `converted`.

## Gambaran Umum

Storage policy mendefinisikan aturan kontrol akses untuk bucket Supabase Storage. Task ini mengkonfigurasi policy untuk memastikan:

- ✅ User hanya bisa upload file ke folder mereka sendiri di bucket `uploads`
- ✅ User hanya bisa baca file mereka sendiri dari bucket `uploads`
- ✅ User hanya bisa baca file converted mereka sendiri dari bucket `converted`
- ✅ Service aplikasi bisa menulis file converted ke bucket `converted`
- ✅ User tidak bisa mengakses file user lain
- ✅ User yang tidak terautentikasi tidak punya akses langsung ke storage

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- ✅ Menyelesaikan **Task 7.1** (Storage bucket sudah dibuat)
- ✅ Kedua bucket `uploads` dan `converted` ada di Supabase Storage
- ✅ Akses ke Supabase Dashboard
- ✅ Permission Admin/Owner pada project Supabase

---

## Memahami Storage Policy

### Struktur Policy

Storage policy di Supabase bekerja pada tabel `storage.objects` dan menggunakan struktur berikut:

```sql
CREATE POLICY "nama_policy"
ON storage.objects
FOR <operasi>  -- SELECT, INSERT, UPDATE, DELETE
TO <role>      -- authenticated, anon, public
USING (<kondisi>)      -- Untuk SELECT, UPDATE, DELETE
WITH CHECK (<kondisi>) -- Untuk INSERT, UPDATE
```

### Organisasi Path File

File di bucket diorganisir berdasarkan user ID:

```
uploads/{user-id}/{filename}
converted/{user-id}/{filename}
```

Organisasi ini memungkinkan policy untuk mengecek apakah user ID di path cocok dengan ID user yang terautentikasi.

### Fungsi Helper

Supabase menyediakan fungsi helper untuk storage policy:

- `storage.foldername(name)` - Ekstrak komponen path folder dari path file
- `auth.uid()` - Mengembalikan UUID user yang terautentikasi
- `bucket_id` - Identifier bucket (contoh: 'uploads', 'converted')

---

## Langkah 1: Akses SQL Editor

1. Login ke Supabase Dashboard Anda di https://supabase.com/dashboard
2. Pilih project FluxConvert Anda
3. Di sidebar kiri, klik **SQL Editor** (ikon terlihat seperti database atau kode)
4. Anda harus melihat interface SQL Editor dengan query editor

---

## Langkah 2: Buat Policy untuk Bucket 'uploads'

### Policy 1: User Bisa Upload File Mereka Sendiri

Policy ini mengizinkan user yang terautentikasi untuk upload file ke folder mereka sendiri di bucket `uploads`.

**Copy dan jalankan SQL ini:**

```sql
-- Policy: User bisa upload file mereka sendiri ke bucket uploads
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi INSERT (upload file)
- ✅ Hanya untuk user yang terautentikasi
- ✅ Hanya ke bucket 'uploads'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir upload ke folder user lain
- ❌ Memblokir upload yang tidak terautentikasi

**Contoh:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Bisa upload ke: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- ❌ Tidak bisa upload ke: `uploads/other-user-id/document.docx`

---

### Policy 2: User Bisa Baca File Mereka Sendiri

Policy ini mengizinkan user yang terautentikasi untuk baca (download) file dari folder mereka sendiri di bucket `uploads`.

**Copy dan jalankan SQL ini:**

```sql
-- Policy: User bisa baca file mereka sendiri dari bucket uploads
CREATE POLICY "Users can read their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi SELECT (baca/download file)
- ✅ Hanya untuk user yang terautentikasi
- ✅ Hanya dari bucket 'uploads'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir pembacaan file user lain

**Contoh:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Bisa baca: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- ❌ Tidak bisa baca: `uploads/other-user-id/document.docx`

---

### Policy 3: User Bisa Hapus File Mereka Sendiri (Opsional)

Policy ini mengizinkan user yang terautentikasi untuk hapus file dari folder mereka sendiri di bucket `uploads`. Ini opsional tapi direkomendasikan untuk manajemen file user.

**Copy dan jalankan SQL ini:**

```sql
-- Policy: User bisa hapus file mereka sendiri dari bucket uploads
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi DELETE (penghapusan file)
- ✅ Hanya untuk user yang terautentikasi
- ✅ Hanya dari bucket 'uploads'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir penghapusan file user lain

---

## Langkah 3: Buat Policy untuk Bucket 'converted'

### Policy 4: User Bisa Baca File Converted Mereka

Policy ini mengizinkan user yang terautentikasi untuk baca (download) file converted dari folder mereka sendiri di bucket `converted`.

**Copy dan jalankan SQL ini:**

```sql
-- Policy: User bisa baca file converted mereka dari bucket converted
CREATE POLICY "Users can read their converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi SELECT (baca/download file)
- ✅ Hanya untuk user yang terautentikasi
- ✅ Hanya dari bucket 'converted'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir pembacaan file converted user lain

**Contoh:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Bisa baca: `converted/123e4567-e89b-12d3-a456-426614174000/document.pdf`
- ❌ Tidak bisa baca: `converted/other-user-id/document.pdf`

---

### Policy 5: Service Bisa Tulis File Converted

Policy ini mengizinkan service aplikasi (user yang terautentikasi) untuk menulis file converted ke bucket `converted`. Service berjalan dengan autentikasi user, jadi policy ini mengizinkan user yang terautentikasi untuk menulis ke bucket converted (tapi kode aplikasi memastikan mereka hanya menulis ke folder mereka sendiri).

**Copy dan jalankan SQL ini:**

```sql
-- Policy: Service bisa tulis file converted ke bucket converted
CREATE POLICY "Service can write converted files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi INSERT (upload file)
- ✅ Hanya untuk user yang terautentikasi (service berjalan sebagai user terautentikasi)
- ✅ Hanya ke bucket 'converted'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir penulisan ke folder user lain

**Catatan**: Kode aplikasi bertanggung jawab memastikan file ditulis ke folder user yang benar. Policy ini memberikan pemeriksaan keamanan.

---

### Policy 6: User Bisa Hapus File Converted Mereka (Opsional)

Policy ini mengizinkan user yang terautentikasi untuk hapus file converted dari folder mereka sendiri. Ini opsional tapi berguna untuk manajemen file user.

**Copy dan jalankan SQL ini:**

```sql
-- Policy: User bisa hapus file converted mereka dari bucket converted
CREATE POLICY "Users can delete their converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Apa yang dilakukan policy ini:**
- ✅ Mengizinkan operasi DELETE (penghapusan file)
- ✅ Hanya untuk user yang terautentikasi
- ✅ Hanya dari bucket 'converted'
- ✅ Hanya jika folder pertama di path cocok dengan ID user
- ❌ Memblokir penghapusan file user lain

---

## Langkah 4: Jalankan Semua Policy (Script Lengkap)

Untuk kemudahan, berikut script lengkap dengan semua policy. Anda bisa copy dan jalankan seluruh script ini di SQL Editor:

```sql
-- ============================================================================
-- FluxConvert Storage Policies
-- Task 7.2: Konfigurasi storage policy untuk bucket uploads dan converted
-- ============================================================================

-- POLICY BUCKET UPLOADS
-- ============================================================================

-- Policy 1: User bisa upload file mereka sendiri ke bucket uploads
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: User bisa baca file mereka sendiri dari bucket uploads
CREATE POLICY "Users can read their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: User bisa hapus file mereka sendiri dari bucket uploads (opsional)
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- POLICY BUCKET CONVERTED
-- ============================================================================

-- Policy 4: User bisa baca file converted mereka dari bucket converted
CREATE POLICY "Users can read their converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Service bisa tulis file converted ke bucket converted
CREATE POLICY "Service can write converted files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: User bisa hapus file converted mereka (opsional)
CREATE POLICY "Users can delete their converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- Query Verifikasi
-- ============================================================================

-- Lihat semua storage policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Hitung policy berdasarkan bucket (harus melihat policy untuk uploads dan converted)
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

---

## Langkah 5: Verifikasi Policy

Setelah menjalankan script SQL, verifikasi policy dibuat dengan benar.

### Metode 1: Menggunakan Query SQL

Jalankan query ini di SQL Editor:

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

**Output yang diharapkan** (6 policy):

| policyname | operation | roles |
|------------|-----------|-------|
| Service can write converted files | INSERT | {authenticated} |
| Users can delete their converted files | DELETE | {authenticated} |
| Users can delete their own uploaded files | DELETE | {authenticated} |
| Users can read their converted files | SELECT | {authenticated} |
| Users can read their own uploaded files | SELECT | {authenticated} |
| Users can upload their own files | INSERT | {authenticated} |

### Metode 2: Menggunakan Supabase Dashboard

1. Pergi ke **Authentication** → **Policies** di Supabase Dashboard
2. Cari policy pada tabel `storage.objects`
3. Anda harus melihat 6 policy terdaftar (atau 4 jika Anda skip policy DELETE opsional)

---

## Langkah 6: Test Policy (Opsional)

Untuk test bahwa policy bekerja dengan benar, Anda bisa menggunakan Supabase JavaScript client:

### Test 1: Upload File ke Bucket Uploads

```javascript
// Ini harus berhasil untuk user yang terautentikasi
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(`${userId}/test-file.txt`, file);

console.log('Hasil upload:', { data, error });
// Yang diharapkan: data berisi path file, error adalah null
```

### Test 2: Baca File dari Bucket Uploads

```javascript
// Ini harus berhasil untuk pemilik file
const { data, error } = await supabase.storage
  .from('uploads')
  .download(`${userId}/test-file.txt`);

console.log('Hasil download:', { data, error });
// Yang diharapkan: data berisi blob file, error adalah null
```

### Test 3: Upload File ke Bucket Converted

```javascript
// Ini harus berhasil untuk user yang terautentikasi (service)
const { data, error } = await supabase.storage
  .from('converted')
  .upload(`${userId}/converted-file.pdf`, file);

console.log('Hasil upload:', { data, error });
// Yang diharapkan: data berisi path file, error adalah null
```

### Test 4: Baca File dari Bucket Converted

```javascript
// Ini harus berhasil untuk pemilik file
const { data, error } = await supabase.storage
  .from('converted')
  .download(`${userId}/converted-file.pdf`);

console.log('Hasil download:', { data, error });
// Yang diharapkan: data berisi blob file, error adalah null
```

### Test 5: Akses File User Lain (Harus Gagal)

```javascript
// Ini harus GAGAL - user tidak bisa akses file user lain
const { data, error } = await supabase.storage
  .from('uploads')
  .download(`other-user-id/their-file.txt`);

console.log('Hasil download:', { data, error });
// Yang diharapkan: error tidak null, berisi pesan permission denied
```

---

## Memahami Logika Policy

### Ekstraksi Path

Kunci dari policy ini adalah mengekstrak user ID dari path file:

```sql
(storage.foldername(name))[1]
```

**Cara kerjanya:**

1. `name` adalah path file lengkap: `uploads/user-id/filename.txt`
2. `storage.foldername(name)` memisahkan path menjadi array: `['user-id', 'filename.txt']`
3. `[1]` mengambil elemen pertama (user ID): `'user-id'`
4. Bandingkan dengan `auth.uid()::text` (ID user yang terautentikasi)

**Contoh:**
- Path file: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- User ID yang diekstrak: `123e4567-e89b-12d3-a456-426614174000`
- ID user terautentikasi: `123e4567-e89b-12d3-a456-426614174000`
- Cocok: ✅ Akses diberikan

### Kondisi Policy

**WITH CHECK** (untuk INSERT):
- Dievaluasi saat membuat record baru
- Menentukan apakah insert diizinkan
- Digunakan untuk operasi upload

**USING** (untuk SELECT, DELETE):
- Dievaluasi saat membaca atau menghapus record
- Menentukan apakah operasi diizinkan
- Digunakan untuk operasi download dan delete

---

## Pertimbangan Keamanan

### Apa yang Dilindungi Policy Ini

✅ **Akses Tidak Sah**: User tidak bisa akses file user lain  
✅ **Kebocoran Data**: File diisolasi berdasarkan user ID  
✅ **Upload Berbahaya**: User hanya bisa upload ke folder mereka sendiri  
✅ **Penghapusan Tidak Sah**: User hanya bisa hapus file mereka sendiri  
✅ **Akses Anonim**: User yang tidak terautentikasi tidak punya akses langsung ke storage  

### Apa yang TIDAK Dilindungi Policy Ini

❌ **Error Logika Aplikasi**: Jika aplikasi menulis ke folder yang salah, policy tidak akan menangkapnya (tapi akan mencegah akses)  
❌ **Bypass Service Role**: Service role key bypass policy RLS (jaga kerahasiaannya!)  
❌ **Validasi Konten File**: Policy tidak memvalidasi konten file (gunakan pembatasan tipe MIME pada bucket)  

### Best Practice

1. **Jangan pernah expose service role key** ke client
2. **Selalu gunakan autentikasi user** untuk operasi storage
3. **Validasi path file** di kode aplikasi sebelum operasi storage
4. **Gunakan signed URL** untuk download file (akses terbatas waktu)
5. **Monitor penggunaan storage** untuk mendeteksi penyalahgunaan
6. **Audit policy secara berkala** untuk memastikan cocok dengan requirements

---

## Troubleshooting

### Masalah: "Permission denied" saat upload file

**Kemungkinan penyebab:**
1. User tidak terautentikasi
2. Path file tidak cocok dengan user ID
3. Policy tidak dibuat dengan benar
4. Bucket tidak ada

**Solusi:**
- Verifikasi user terautentikasi: `const { data: { user } } = await supabase.auth.getUser()`
- Cek format path file: `uploads/{user-id}/{filename}`
- Jalankan ulang script pembuatan policy
- Verifikasi bucket ada di dashboard Storage

### Masalah: Error "Policy already exists"

**Solusi:**
- Policy dengan nama yang sama sudah ada
- Hapus policy yang ada terlebih dahulu:

```sql
-- Hapus policy yang ada (jika diperlukan)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their converted files" ON storage.objects;
DROP POLICY IF EXISTS "Service can write converted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their converted files" ON storage.objects;
```

Lalu jalankan ulang script pembuatan.

### Masalah: Policy dibuat tapi masih mendapat error permission

**Kemungkinan penyebab:**
1. RLS tidak diaktifkan pada tabel storage.objects (harus diaktifkan secara default)
2. User ID di path tidak cocok dengan user terautentikasi
3. Nama bucket tidak cocok

**Solusi:**
- Verifikasi RLS diaktifkan:

```sql
-- Cek apakah RLS diaktifkan pada storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
-- rowsecurity harus true
```

- Log path file dan user ID di aplikasi Anda untuk debug
- Verifikasi nama bucket persis 'uploads' dan 'converted' (case-sensitive)

### Masalah: Tidak bisa hapus file

**Solusi:**
- Pastikan Anda membuat policy DELETE (Policy 3 dan Policy 6)
- Jika Anda skip, jalankan:

```sql
-- Tambahkan policy DELETE
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their converted files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'converted' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Checklist Verifikasi

Sebelum melanjutkan ke task selanjutnya, verifikasi:

- [ ] Semua 6 policy dibuat dengan sukses (atau 4 jika skip policy DELETE)
- [ ] Policy muncul di hasil query `pg_policies`
- [ ] Tidak ada error SQL saat menjalankan script
- [ ] Test upload ke bucket `uploads` berhasil untuk user terautentikasi
- [ ] Test download dari bucket `uploads` berhasil untuk pemilik file
- [ ] Test upload ke bucket `converted` berhasil untuk user terautentikasi
- [ ] Test download dari bucket `converted` berhasil untuk pemilik file
- [ ] Test akses file user lain gagal dengan error permission
- [ ] Akses tidak terautentikasi gagal dengan error permission

---

## Ringkasan Policy

| Nama Policy | Bucket | Operasi | Role | Tujuan |
|-------------|--------|-----------|------|---------|
| Users can upload their own files | uploads | INSERT | authenticated | Izinkan user upload file input |
| Users can read their own uploaded files | uploads | SELECT | authenticated | Izinkan user download file input mereka |
| Users can delete their own uploaded files | uploads | DELETE | authenticated | Izinkan user hapus file input mereka |
| Users can read their converted files | converted | SELECT | authenticated | Izinkan user download file converted |
| Service can write converted files | converted | INSERT | authenticated | Izinkan service simpan file converted |
| Users can delete their converted files | converted | DELETE | authenticated | Izinkan user hapus file converted |

---

## Langkah Selanjutnya

Setelah menyelesaikan task ini, lanjutkan ke:

**Task 8.1-8.4**: Buat fungsi utility storage
- Implementasi fungsi upload file
- Implementasi fungsi penghapusan file
- Implementasi generator signed URL
- Tulis unit test untuk utility storage

Fungsi utility ini akan menggunakan storage bucket dan policy yang dikonfigurasi di Task 7.1 dan 7.2.

---

## Dokumentasi Terkait

- **Storage Bucket Setup**: `supabase/STORAGE_BUCKETS_SETUP_ID.md`
- **Storage Bucket Quick Reference**: `supabase/STORAGE_BUCKETS_QUICK_REFERENCE_ID.md`
- **Dokumen Desain**: `.kiro/specs/app-enhancements/design.md` (bagian Storage Policy)
- **Requirements**: `.kiro/specs/app-enhancements/requirements.md` (Requirements 6.1, 6.2, 6.3)
- **Dokumentasi Supabase Storage**: https://supabase.com/docs/guides/storage
- **Dokumentasi Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

---

**Versi Dokumen**: 1.0  
**Task**: 7.2 Konfigurasi storage policy  
**Requirements**: 6.1, 6.2, 6.3  
**Task Terkait**: 7.1 (Buat storage bucket), 8.1-8.4 (Fungsi utility storage)
