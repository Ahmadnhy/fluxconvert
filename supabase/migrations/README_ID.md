# Migrasi Supabase

Folder ini berisi file migrasi database untuk aplikasi FluxConvert.

## Cara Menerapkan Migrasi

Karena project ini tidak menggunakan Supabase CLI, migrasi diterapkan secara manual melalui Supabase Dashboard:

1. Pergi ke dashboard project Supabase Anda
2. Navigasi ke **SQL Editor**
3. Klik **New Query**
4. Copy isi dari file migrasi yang ingin Anda terapkan
5. Paste ke SQL Editor
6. Klik **Run** untuk mengeksekusi migrasi

## File Migrasi

### 001_add_status_to_files.sql

**Tujuan**: Menambahkan kolom `status` ke tabel `files` untuk melacak apakah file aktif atau dihapus.

**Perubahan**:
- Menambahkan kolom `status` dengan nilai 'active' atau 'deleted'
- Mengatur nilai default menjadi 'active'
- Membuat index pada kolom `status`
- Membuat composite index pada `created_at` dan `status` untuk query pembersihan yang efisien

**Diperlukan untuk**: Job pembersihan file (Phase 4)

**Untuk menerapkan**:
```sql
-- Copy dan paste isi dari 001_add_status_to_files.sql ke Supabase SQL Editor
```

### 002_create_rate_limits_table.sql (OPSIONAL)

**Tujuan**: Membuat tabel `rate_limits` untuk pelacakan rate limiting persisten.

**Catatan**: Migrasi ini **opsional**. Aplikasi menggunakan rate limiting in-memory secara default untuk kesederhanaan. Hanya terapkan migrasi ini jika Anda memerlukan rate limiting persisten di seluruh restart server atau deployment terdistribusi.

**Perubahan**:
- Membuat tabel `rate_limits` dengan identifier, endpoint, request_count, window_start
- Menambahkan unique constraint pada (identifier, endpoint)
- Membuat index pada identifier dan window_start
- Membuat composite index pada (identifier, endpoint)
- Mengaktifkan Row Level Security dengan akses service role
- Menambahkan trigger untuk update timestamp updated_at

**Kasus penggunaan**:
- Deployment terdistribusi (multiple server instances)
- Rate limiting persisten di seluruh restart server
- Analitik rate limiting lanjutan

**Untuk menerapkan**:
```sql
-- Copy dan paste isi dari 002_create_rate_limits_table.sql ke Supabase SQL Editor
```

## Verifikasi

Setelah menerapkan migrasi, verifikasi bahwa berhasil:

1. Pergi ke **Table Editor** di dashboard Supabase
2. Pilih tabel `files`
3. Cek bahwa kolom `status` ada
4. Pergi ke **Database** > **Indexes**
5. Verifikasi index baru sudah dibuat

## Rollback

Jika Anda perlu rollback migrasi:

### Untuk 001_add_status_to_files.sql:
```sql
-- Hapus index
DROP INDEX IF EXISTS public.idx_files_status;
DROP INDEX IF EXISTS public.idx_files_created_at_status;

-- Hapus kolom
ALTER TABLE public.files DROP COLUMN IF EXISTS status;
```

### Untuk 002_create_rate_limits_table.sql:
```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_rate_limit_updated ON public.rate_limits;

-- Drop function
DROP FUNCTION IF EXISTS public.update_rate_limit_timestamp();

-- Drop index
DROP INDEX IF EXISTS public.idx_rate_limits_identifier;
DROP INDEX IF EXISTS public.idx_rate_limits_window_start;
DROP INDEX IF EXISTS public.idx_rate_limits_identifier_endpoint;

-- Drop table
DROP TABLE IF EXISTS public.rate_limits;
```

## Setup Storage (Task 7.1 dan 7.2)

### Task 7.1: Buat Storage Bucket

Storage bucket harus dibuat melalui UI Supabase Dashboard (bukan via SQL).

**Dokumentasi**:
- **Panduan Detail**: `supabase/STORAGE_BUCKETS_SETUP_ID.md`
- **Referensi Cepat**: `supabase/STORAGE_BUCKETS_QUICK_REFERENCE_ID.md`

**Bucket yang harus dibuat**:
1. `uploads` - Private, limit 50 MB, 5 tipe MIME
2. `converted` - Private, limit 100 MB, 4 tipe MIME

### Task 7.2: Konfigurasi Storage Policy

Storage policy mengontrol akses ke storage bucket dan harus dibuat via SQL Editor.

**Dokumentasi**:
- **Panduan Detail**: `supabase/STORAGE_POLICIES_SETUP_ID.md`
- **Referensi Cepat**: `supabase/STORAGE_POLICIES_QUICK_REFERENCE_ID.md`

**Setup Cepat**:
1. Buka Supabase Dashboard → SQL Editor
2. Copy script SQL lengkap dari `supabase/STORAGE_POLICIES_QUICK_REFERENCE_ID.md`
3. Paste dan jalankan script
4. Verifikasi 6 policy sudah dibuat

**Policy yang dibuat**:
- User bisa upload file mereka sendiri (bucket uploads)
- User bisa baca file upload mereka sendiri (bucket uploads)
- User bisa hapus file upload mereka sendiri (bucket uploads)
- User bisa baca file converted mereka (bucket converted)
- Service bisa tulis file converted (bucket converted)
- User bisa hapus file converted mereka (bucket converted)

## Catatan

- Selalu backup database Anda sebelum menerapkan migrasi
- Test migrasi di environment development terlebih dahulu
- Migrasi dirancang untuk idempoten (aman dijalankan berkali-kali)
- File `schema.sql` utama sudah diupdate untuk menyertakan semua migrasi untuk setup baru
- Storage bucket dan policy harus dikonfigurasi secara manual melalui Supabase Dashboard
