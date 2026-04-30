# 📘 Panduan Setup Lengkap FluxConvert

CTRL + SHIFT + V BUAT LIHATNYA GAMPANG

Panduan ini menggabungkan semua langkah setup yang diperlukan untuk menjalankan aplikasi FluxConvert, disusun dalam urutan yang harus dikerjakan dari awal sampai akhir.

---

## 📋 Daftar Isi

1. [Setup Database Supabase](#1-setup-database-supabase)
2. [Migrasi Database - Tambah Field Status](#2-migrasi-database---tambah-field-status)
3. [Buat Storage Bucket](#3-buat-storage-bucket)
4. [Konfigurasi Storage Policy](#4-konfigurasi-storage-policy)
5. [Setup Vercel Cron Job](#5-setup-vercel-cron-job)

---

# 1. Setup Database Supabase

## Prasyarat

- Akun Supabase (daftar di https://supabase.com)
- Node.js dan npm terinstal

## Langkah 1: Buat Project Supabase

1. Pergi ke https://supabase.com/dashboard
2. Klik "New Project"
3. Isi detail project:
   - **Name**: FluxConvert
   - **Database Password**: Pilih password yang kuat (simpan ini!)
   - **Region**: Pilih region terdekat dengan user Anda
4. Klik "Create new project"
5. Tunggu project di-provision (~2 menit)

## Langkah 2: Dapatkan API Keys

1. Di dashboard project Supabase, pergi ke **Settings** > **API**
2. Copy nilai berikut:
   - **Project URL** (seperti: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (jaga kerahasiaannya!)

## Langkah 3: Konfigurasi Environment Variables

1. Buat file `.env.local` di root project:

```bash
cp .env.local.example .env.local
```

2. Isi kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Langkah 4: Jalankan Database Schema

1. Di dashboard Supabase, pergi ke **SQL Editor**
2. Klik "New Query"
3. Copy seluruh isi dari `supabase/schema.sql`
4. Paste ke SQL Editor
5. Klik **Run** untuk eksekusi
6. Anda harus melihat pesan sukses untuk semua tabel dan fungsi

## Langkah 5: Verifikasi Tabel Database

1. Pergi ke **Table Editor** di dashboard Supabase
2. Anda harus melihat tabel ini:
   - `profiles`
   - `files`
   - `conversions`

✅ **Setup database dasar selesai!**

---

# 2. Migrasi Database - Tambah Field Status

## Apa yang Dilakukan Migrasi Ini

Migrasi ini menambahkan kolom `status` ke tabel `files` yang akan digunakan untuk melacak apakah file aktif atau sudah ditandai untuk dihapus. Ini diperlukan untuk job pembersihan file otomatis.

**Perubahan**:
- Menambahkan kolom `status` (nilai: 'active' atau 'deleted')
- Mengatur nilai default menjadi 'active'
- Membuat index untuk query yang efisien

## Langkah-Langkah

### 1. Buka SQL Editor

1. Pergi ke dashboard Supabase Anda
2. Klik **SQL Editor** di sidebar kiri
3. Klik **New Query**

### 2. Copy dan Jalankan SQL Migrasi

Copy script SQL ini dan paste ke SQL Editor:

```sql
-- Tambahkan kolom status dengan check constraint
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'deleted'));

-- Buat index pada status untuk filtering yang efisien
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);

-- Buat composite index pada created_at dan status untuk query job pembersihan
CREATE INDEX IF NOT EXISTS idx_files_created_at_status ON public.files(created_at DESC, status);

-- Tambahkan comment untuk dokumentasi kolom
COMMENT ON COLUMN public.files.status IS 'Status file: active (tersedia) atau deleted (ditandai untuk pembersihan)';
```

### 3. Klik Run

Klik tombol **Run** atau tekan `Ctrl+Enter` / `Cmd+Enter`

### 4. Verifikasi

**Cek Kolom Ada:**
1. Pergi ke **Table Editor** > tabel **files**
2. Verifikasi kolom `status` ada dengan nilai default 'active'

**Cek Index:**
1. Pergi ke **Database** > **Indexes**
2. Verifikasi index ini ada:
   - `idx_files_status`
   - `idx_files_created_at_status`

**Test Constraint:**
```sql
-- Ini harus GAGAL (bagus!)
INSERT INTO public.files (file_name, file_type, file_size, storage_path, storage_bucket, status)
VALUES ('test.pdf', 'application/pdf', 1024, '/test/test.pdf', 'uploads', 'invalid');
```

### Test Nilai Valid

Coba jalankan query ini (harus berhasil):
```sql
-- Ini harus berhasil
SELECT 'active'::TEXT IN ('active', 'deleted') as is_valid;

✅ **Migrasi database selesai!**

---

# 3. Buat Storage Bucket

## Gambaran Umum

Aplikasi FluxConvert memerlukan dua storage bucket:

1. **uploads** - Menyimpan file input yang diupload user (50 MB limit)
2. **converted** - Menyimpan file output hasil konversi (100 MB limit)

## Langkah 1: Akses Storage

1. Login ke Supabase Dashboard
2. Pilih project FluxConvert Anda
3. Klik **Storage** di sidebar kiri

## Langkah 2: Buat Bucket 'uploads'

### 2.1 Mulai Pembuatan

1. Klik tombol **"New bucket"**
2. Dialog "Create a new bucket" akan muncul

### 2.2 Konfigurasi Bucket

Isi pengaturan berikut:

| Pengaturan | Nilai |
|---------|-------|
| **Name** | `uploads` |
| **Public bucket** | ❌ **OFF** (tidak dicentang) |
| **File size limit** | `52428800` bytes (50 MB) |

### 2.3 Tipe MIME yang Diizinkan

Masukkan tipe MIME berikut (satu per baris atau dipisah koma):

```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/msword
image/jpeg
image/png
application/pdf
```

### 2.4 Buat Bucket

1. Review semua pengaturan
2. Klik **"Create bucket"**
3. Bucket 'uploads' harus muncul di daftar

## Langkah 3: Buat Bucket 'converted'

### 3.1 Mulai Pembuatan

1. Klik tombol **"New bucket"** lagi
2. Dialog akan muncul

### 3.2 Konfigurasi Bucket

| Pengaturan | Nilai |
|---------|-------|
| **Name** | `converted` |
| **Public bucket** | ❌ **OFF** (tidak dicentang) |
| **File size limit** | `104857600` bytes (100 MB) |

### 3.3 Tipe MIME yang Diizinkan

```
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
```

### 3.4 Buat Bucket

1. Review semua pengaturan
2. Klik **"Create bucket"**
3. Bucket 'converted' harus muncul di daftar

## Verifikasi

Di interface Storage, Anda harus melihat:
- ✅ **uploads** (Private, 50 MB limit)
- ✅ **converted** (Private, 100 MB limit)

### Konversi Ukuran File

| MB | Bytes |
|----|-------|
| 50 MB | 52,428,800 bytes |
| 100 MB | 104,857,600 bytes |

✅ **Storage bucket selesai dibuat!**

---

# 4. Konfigurasi Storage Policy

## Gambaran Umum

Storage policy mengontrol siapa yang bisa upload, baca, dan hapus file di bucket. Kita akan membuat 6 policy:

**Bucket uploads:**
1. User bisa upload file mereka sendiri
2. User bisa baca file mereka sendiri
3. User bisa hapus file mereka sendiri

**Bucket converted:**
4. User bisa baca file converted mereka
5. Service bisa tulis file converted
6. User bisa hapus file converted mereka

## Langkah 1: Buka SQL Editor

1. Di dashboard Supabase, klik **SQL Editor**
2. Klik **New Query**

## Langkah 2: Copy dan Jalankan Script Lengkap

Copy seluruh script SQL ini dan paste ke SQL Editor:

```sql
-- ============================================================================
-- FluxConvert Storage Policies - Script Lengkap
-- ============================================================================

-- POLICY BUCKET UPLOADS
-- ============================================================================

-- Policy 1: User bisa upload file mereka sendiri
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: User bisa baca file mereka sendiri
CREATE POLICY "Users can read their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: User bisa hapus file mereka sendiri
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

-- Policy 4: User bisa baca file converted mereka
CREATE POLICY "Users can read their converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Service bisa tulis file converted
CREATE POLICY "Service can write converted files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: User bisa hapus file converted mereka
CREATE POLICY "Users can delete their converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Langkah 3: Klik Run

Klik tombol **Run** atau tekan `Ctrl+Enter` / `Cmd+Enter`

## Langkah 4: Verifikasi Policy

Jalankan query verifikasi ini:

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

| policyname | operation | roles |
|------------|-----------|-------|
| Service can write converted files | INSERT | {authenticated} |
| Users can delete their converted files | DELETE | {authenticated} |
| Users can delete their own uploaded files | DELETE | {authenticated} |
| Users can read their converted files | SELECT | {authenticated} |
| Users can read their own uploaded files | SELECT | {authenticated} |
| Users can upload their own files | INSERT | {authenticated} |

## Penjelasan Policy

### Format Path File

File diorganisir berdasarkan user ID:
```
uploads/{user-id}/{filename}
converted/{user-id}/{filename}
```

### Cara Kerja Policy

Policy mengecek apakah user ID di path file cocok dengan user yang terautentikasi:

```sql
auth.uid()::text = (storage.foldername(name))[1]
```

**Contoh:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Bisa akses: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- ❌ Tidak bisa akses: `uploads/other-user-id/document.docx`

✅ **Storage policy selesai dikonfigurasi!**

---

# 5. Setup Vercel Cron Job

## Gambaran Umum

Vercel Cron job akan berjalan otomatis setiap hari pada pukul 2:00 pagi UTC untuk menghapus file yang lebih lama dari 7 hari dari Supabase Storage.

## Langkah 1: Generate CRON_SECRET

Jalankan perintah ini di terminal untuk generate secret yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy outputnya (akan terlihat seperti: `a1b2c3d4e5f6...`)

## Langkah 2: Tambahkan ke Environment Variables Lokal

Tambahkan ke file `.env.local` Anda:

```env
CRON_SECRET=secret_yang_anda_generate_disini
```

## Langkah 3: Verifikasi File vercel.json

File `vercel.json` di root project harus sudah ada dengan isi:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Penjelasan Jadwal:** `0 2 * * *`
- Menit: 0 (tepat di awal jam)
- Jam: 2 (pukul 2:00 pagi)
- Tanggal: * (setiap hari)
- Bulan: * (setiap bulan)
- Hari: * (setiap hari dalam seminggu)

## Langkah 4: Test Lokal (Opsional)

Test endpoint secara lokal:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer secret_yang_anda_generate_disini"
```

Response yang diharapkan:

```json
{
  "success": true,
  "summary": {
    "totalProcessed": 5,
    "successfullyDeleted": 5,
    "failed": 0,
    "errors": []
  }
}
```

## Langkah 5: Setup di Vercel Production

### 5.1 Tambahkan Environment Variable

1. Pergi ke dashboard Vercel: https://vercel.com/dashboard
2. Pilih project FluxConvert Anda
3. Klik **Settings** → **Environment Variables**
4. Klik **Add New**
5. Masukkan:
   - **Key:** `CRON_SECRET`
   - **Value:** (paste secret yang Anda generate)
   - **Environment:** Pilih **Production**
6. Klik **Save**

### 5.2 Deploy ke Vercel

Push code Anda ke GitHub atau deploy ulang:

```bash
git add .
git commit -m "Add Vercel Cron configuration"
git push
```

Vercel akan otomatis deploy.

### 5.3 Verifikasi Cron Job

1. Pergi ke dashboard project Vercel Anda
2. Klik tab **Cron Jobs**
3. Anda harus melihat: `/api/cron/cleanup` dijadwalkan untuk `0 2 * * *`
4. Klik **Run Now** untuk test manual
5. Cek tab **Logs** untuk verifikasi eksekusi berhasil

## Monitoring

### Lihat Logs

1. Pergi ke Vercel dashboard → **Logs**
2. Filter berdasarkan function: `/api/cron/cleanup`
3. Cari pesan:
   - ✅ `[Cleanup Cron] Starting scheduled file cleanup job`
   - ✅ `[Cleanup Cron] Cleanup job completed successfully`
   - ✅ `[Cleanup Cron] Summary: X/Y files deleted`

### Setup Alerts

1. Pergi ke **Settings** → **Notifications**
2. Aktifkan **Cron Job Failures**
3. Tambahkan email atau Slack webhook Anda

✅ **Vercel Cron Job selesai dikonfigurasi!**

---

# 🎉 Setup Selesai!

Selamat! Anda telah menyelesaikan semua setup yang diperlukan untuk aplikasi FluxConvert:

## Checklist Final

- [x] ✅ Database Supabase dibuat dan schema dijalankan
- [x] ✅ Migrasi field status diterapkan
- [x] ✅ Storage bucket 'uploads' dan 'converted' dibuat
- [x] ✅ Storage policy dikonfigurasi (6 policy)
- [ ] ✅ Vercel Cron job dikonfigurasi
- [ ] ✅ Environment variables diset (lokal dan production)

## Langkah Selanjutnya

1. **Test Aplikasi Lokal:**
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000

2. **Test Fitur:**
   - Registrasi user baru
   - Login
   - Upload dan convert file
   - Lihat conversion history
   - Download file converted

3. **Deploy ke Production:**
   - Push ke GitHub
   - Vercel akan otomatis deploy
   - Verifikasi semua fitur bekerja di production

## Troubleshooting Umum

### "Invalid API key"
- Cek `.env.local` sudah benar
- Restart development server

### "Permission denied" saat upload
- Verifikasi storage policy sudah dibuat
- Cek user sudah terautentikasi

### "Storage upload failed"
- Verifikasi bucket sudah dibuat
- Cek file size tidak melebihi limit

### Cron job tidak berjalan
- Verifikasi `vercel.json` ada di root project
- Cek `CRON_SECRET` sudah diset di Vercel
- Deploy ulang aplikasi

## Support

Jika mengalami masalah:
1. Cek dokumentasi Supabase: https://supabase.com/docs
2. Cek dokumentasi Vercel: https://vercel.com/docs
3. Review log error di dashboard
4. Cek file README.md untuk informasi tambahan

---

**Selamat menggunakan FluxConvert! 🚀**
