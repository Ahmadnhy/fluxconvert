# Bugfix Requirements Document

## Introduction

Bug ini mencegah users yang belum login (anonymous users) untuk mengupload dan convert file Word ke PDF di halaman Word to PDF converter. Error message "Failed to upload file to storage" muncul karena storage policies di Supabase hanya mengizinkan authenticated users untuk upload, sementara kode aplikasi sudah dirancang untuk mendukung anonymous users dengan path `anonymous/{timestamp}-{filename}`.

**Impact**: Anonymous users tidak dapat menggunakan fitur utama aplikasi (Word to PDF conversion), yang mengurangi aksesibilitas dan user experience.

**Root Cause**: Mismatch antara storage policies (hanya `authenticated`) dan implementasi kode (mendukung `authenticated` dan `anonymous`).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN anonymous user (belum login) mengupload file .docx di halaman Word to PDF THEN sistem mengembalikan error "Failed to upload file to storage" dan upload gagal

1.2 WHEN anonymous user mencoba convert file Word ke PDF THEN sistem tidak dapat menyimpan file ke storage bucket karena policy menolak akses

1.3 WHEN anonymous user mengakses endpoint `/api/convert/word-to-pdf` tanpa authentication THEN Supabase storage menolak operasi INSERT ke bucket 'uploads' dan 'converted'

### Expected Behavior (Correct)

2.1 WHEN anonymous user (belum login) mengupload file .docx di halaman Word to PDF THEN sistem SHALL berhasil mengupload file ke storage bucket 'uploads' dengan path `anonymous/{timestamp}-{filename}`

2.2 WHEN anonymous user mencoba convert file Word ke PDF THEN sistem SHALL berhasil menyimpan file hasil konversi dan mengembalikan download URL (base64 atau signed URL)

2.3 WHEN anonymous user mengakses endpoint `/api/convert/word-to-pdf` tanpa authentication THEN Supabase storage SHALL mengizinkan operasi INSERT ke bucket 'uploads' dan 'converted' untuk anonymous users

### Unchanged Behavior (Regression Prevention)

3.1 WHEN authenticated user (sudah login) mengupload file .docx di halaman Word to PDF THEN sistem SHALL CONTINUE TO berhasil mengupload file ke storage bucket 'uploads' dengan path `{user_id}/{timestamp}-{filename}`

3.2 WHEN authenticated user mencoba convert file Word ke PDF THEN sistem SHALL CONTINUE TO menyimpan conversion record ke database dan generate signed URL untuk download

3.3 WHEN authenticated user mengakses dashboard untuk melihat conversion history THEN sistem SHALL CONTINUE TO menampilkan hanya file-file milik user tersebut (RLS tetap enforce untuk read operations)

3.4 WHEN authenticated user mencoba mengakses file milik user lain THEN sistem SHALL CONTINUE TO menolak akses (RLS policies untuk SELECT/DELETE/UPDATE tetap enforce user ownership)

3.5 WHEN file cleanup job berjalan THEN sistem SHALL CONTINUE TO dapat menghapus file-file lama dari storage buckets sesuai retention policy
