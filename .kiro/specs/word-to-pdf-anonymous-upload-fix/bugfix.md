# Bugfix Requirements Document

## Introduction

Pengguna yang belum login (anonymous users) tidak dapat mengupload dan convert file Word ke PDF pada halaman Word to PDF (localhost:3000/word-to-pdf). Ketika mereka mencoba melakukan konversi, sistem menampilkan error "Failed to upload file to storage" yang disebabkan oleh Row-Level Security (RLS) policy violation di tabel "files" Supabase. Error ini memblokir operasi INSERT untuk pengguna yang tidak terautentikasi.

Bug ini berdampak signifikan karena fitur konversi Word to PDF seharusnya dapat diakses oleh semua pengguna, baik yang sudah login maupun belum login, untuk memberikan pengalaman yang lebih baik dan meningkatkan aksesibilitas layanan.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN pengguna yang belum login (anonymous user) mencoba mengupload file Word (.docx) di halaman /word-to-pdf THEN sistem menampilkan error "Failed to upload file to storage" dan proses konversi gagal

1.2 WHEN sistem mencoba membuat file record di database untuk anonymous user THEN database menolak operasi INSERT dengan error "new row violates row-level security policy for table 'files'" (error code: 42501)

1.3 WHEN anonymous user mengklik tombol "Convert to PDF" setelah mengupload file THEN proses berhenti di tahap upload dan tidak melanjutkan ke tahap konversi

### Expected Behavior (Correct)

2.1 WHEN pengguna yang belum login (anonymous user) mengupload file Word (.docx) di halaman /word-to-pdf THEN sistem SHALL berhasil mengupload file ke storage bucket tanpa error RLS policy violation

2.2 WHEN sistem membuat file record di database untuk anonymous user dengan user_id = null THEN database SHALL menerima operasi INSERT dan membuat record dengan sukses

2.3 WHEN anonymous user mengklik tombol "Convert to PDF" setelah mengupload file THEN sistem SHALL menjalankan proses upload, konversi, dan menyediakan file PDF untuk didownload tanpa error

2.4 WHEN anonymous user berhasil melakukan konversi THEN sistem SHALL mengembalikan file PDF yang dapat didownload (baik melalui signed URL atau base64 data URL)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN pengguna yang sudah login (authenticated user) mengupload file Word dan melakukan konversi THEN sistem SHALL CONTINUE TO berfungsi dengan sempurna seperti sebelumnya (upload, convert, download)

3.2 WHEN authenticated user melakukan konversi THEN sistem SHALL CONTINUE TO membuat conversion record di database dan menyimpan history konversi

3.3 WHEN authenticated user mengakses dashboard THEN sistem SHALL CONTINUE TO menampilkan riwayat konversi mereka dengan benar

3.4 WHEN file dari authenticated user disimpan di storage THEN sistem SHALL CONTINUE TO menggunakan path format `{user_id}/{timestamp}-{filename}`

3.5 WHEN RLS policies diterapkan untuk authenticated users THEN sistem SHALL CONTINUE TO membatasi akses file hanya untuk pemilik file (users can only view/modify their own files)
