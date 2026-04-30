# Panduan Migrasi: Menambahkan Field Status ke Tabel Files

Panduan ini akan memandu Anda melalui proses penerapan migrasi untuk menambahkan field `status` ke tabel `files`.

## Apa yang Dilakukan Migrasi Ini

Migrasi ini menambahkan kolom `status` ke tabel `files` yang akan digunakan untuk melacak apakah file aktif atau sudah ditandai untuk dihapus. Ini diperlukan untuk job pembersihan file otomatis yang akan berjalan setiap hari untuk menghapus file lama.

**Perubahan**:
- Menambahkan kolom `status` (nilai: 'active' atau 'deleted')
- Mengatur nilai default menjadi 'active' untuk semua file yang ada dan baru
- Membuat index pada `status` untuk filtering yang efisien
- Membuat composite index pada `created_at` dan `status` untuk query pembersihan

## Prasyarat

- Akses ke dashboard project Supabase Anda
- Tabel `files` harus sudah ada (dibuat dari schema.sql awal)

## Instruksi Langkah demi Langkah

### Opsi 1: Terapkan File Migrasi (Direkomendasikan)

1. **Buka Supabase Dashboard**
   - Pergi ke https://supabase.com/dashboard
   - Pilih project FluxConvert Anda

2. **Buka SQL Editor**
   - Klik **SQL Editor** di sidebar kiri
   - Klik **New Query**

3. **Copy SQL Migrasi**
   - Buka file `supabase/migrations/001_add_status_to_files.sql`
   - Copy seluruh isinya

4. **Paste dan Eksekusi**
   - Paste SQL ke query editor
   - Klik **Run** (atau tekan Ctrl+Enter / Cmd+Enter)

5. **Verifikasi Sukses**
   - Anda harus melihat pesan sukses
   - Query harus selesai tanpa error

### Opsi 2: Perintah SQL Manual

Jika Anda lebih suka menjalankan perintah secara manual, eksekusi ini di SQL Editor:

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

## Verifikasi

Setelah menerapkan migrasi, verifikasi bahwa berhasil:

### 1. Cek Kolom Ada

Pergi ke **Table Editor** > tabel **files** dan verifikasi:
- Kolom baru bernama `status` ada
- Nilai default adalah 'active'
- Baris yang ada (jika ada) memiliki `status` diset ke 'active'

### 2. Cek Index

Pergi ke **Database** > **Indexes** dan verifikasi index ini ada:
- `idx_files_status`
- `idx_files_created_at_status`

### 3. Test Constraint

Coba jalankan query ini di SQL Editor (harus gagal):
```sql
INSERT INTO public.files (file_name, file_type, file_size, storage_path, storage_bucket, status)
VALUES ('test.pdf', 'application/pdf', 1024, '/test/test.pdf', 'uploads', 'invalid');
```

Hasil yang diharapkan: Pesan error tentang pelanggaran constraint (ini bagus!)

### 4. Test Nilai Valid

Coba jalankan query ini (harus berhasil):
```sql
-- Ini harus berhasil
SELECT 'active'::TEXT IN ('active', 'deleted') as is_valid;
-- Hasil harus: true
```

## Rollback (Jika Diperlukan)

Jika Anda perlu rollback migrasi ini:

```sql
-- Hapus index
DROP INDEX IF EXISTS public.idx_files_status;
DROP INDEX IF EXISTS public.idx_files_created_at_status;

-- Hapus kolom
ALTER TABLE public.files DROP COLUMN IF EXISTS status;
```

**Peringatan**: Hanya rollback jika benar-benar diperlukan. Ini akan menghapus kolom `status` dan semua datanya.

## Dampak pada Data yang Ada

- **File yang ada**: Semua record file yang ada akan otomatis memiliki `status` diset ke 'active'
- **File baru**: Semua record file baru akan default ke 'active' kecuali diset secara eksplisit
- **Tidak ada kehilangan data**: Migrasi ini bersifat aditif dan tidak memodifikasi atau menghapus data yang ada

## Langkah Selanjutnya

Setelah berhasil menerapkan migrasi ini:

1. ✅ Tabel `files` sekarang memiliki kolom `status`
2. ✅ Index sudah ada untuk query yang efisien
3. ✅ Siap untuk implementasi Phase 2 (integrasi storage)
4. ✅ Siap untuk implementasi Phase 4 (job pembersihan file)

## Troubleshooting

### Error: "column already exists"

Ini aman untuk diabaikan. Migrasi menggunakan `IF NOT EXISTS` untuk mencegah error jika kolom sudah ada.

### Error: "permission denied"

Pastikan Anda login sebagai pemilik project atau memiliki permission yang cukup untuk memodifikasi skema database.

### Error: "relation does not exist"

Tabel `files` belum ada. Jalankan `schema.sql` awal terlebih dahulu untuk membuat semua tabel.

## Support

Jika Anda mengalami masalah:
1. Cek log Supabase di dashboard
2. Verifikasi Anda memiliki permission yang benar
3. Pastikan tabel `files` ada
4. Review pesan error dengan teliti

## Status Migrasi

- [x] File migrasi dibuat: `001_add_status_to_files.sql`
- [x] Skema utama diupdate: `schema.sql`
- [ ] Migrasi diterapkan ke database development
- [ ] Migrasi diterapkan ke database production
- [ ] Verifikasi selesai

Tandai checkbox di atas saat Anda menyelesaikan setiap langkah.
