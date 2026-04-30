# Bugfix Requirements Document

## Introduction

FluxConvert adalah aplikasi Next.js untuk konversi file dengan Supabase sebagai backend untuk authentication dan storage. Dokumen ini mengidentifikasi dan mendefinisikan perbaikan untuk empat bug yang mempengaruhi fungsionalitas aplikasi:

1. **Middleware Deprecation Warning**: File `middleware.ts` menggunakan konvensi yang sudah deprecated di Next.js 16.2.4
2. **Remember Me Feature**: Checkbox "Remember me" di halaman login tidak berfungsi
3. **File Upload Error**: Upload file Word untuk konversi gagal dengan error "Failed to upload file to storage"
4. **Download Behavior**: File hasil konversi tidak langsung didownload, melainkan membuka di browser

Bug-bug ini mempengaruhi user experience dan menimbulkan warning yang perlu diperbaiki untuk memastikan kompatibilitas dengan versi Next.js yang digunakan.

---

## Bug Analysis

### Current Behavior (Defect)

#### 1. Middleware Deprecation Warning

1.1 WHEN aplikasi dijalankan dengan Next.js 16.2.4 THEN sistem menampilkan deprecation warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."

1.2 WHEN file `middleware.ts` ada di root project THEN Next.js mendeteksi penggunaan konvensi lama yang tidak direkomendasikan

#### 2. Remember Me Feature Not Working

1.3 WHEN user mencentang checkbox "Remember me" di halaman login THEN checkbox tidak memiliki state management dan tidak menyimpan preferensi user

1.4 WHEN user login dengan "Remember me" dicentang THEN sistem tidak mengatur session persistence yang berbeda dari login biasa

#### 3. File Upload Error

1.5 WHEN authenticated user mengupload file DOCX (contoh: MAMADDDDD.docx, 11.69 KB) untuk konversi Word ke PDF THEN sistem mengembalikan error "Failed to upload file to storage"

1.6 WHEN file upload gagal THEN user tidak dapat melanjutkan proses konversi dan tidak mendapat informasi detail tentang penyebab error

#### 4. Download File Opens in Browser Instead of Downloading

1.7 WHEN authenticated user mengklik tombol "Download" pada file hasil konversi di conversion history THEN browser membuka PDF di tab baru alih-alih langsung mendownload file

1.8 WHEN signed URL digunakan untuk download THEN browser menampilkan PDF inline karena tidak ada header Content-Disposition yang memaksa download

---

### Expected Behavior (Correct)

#### 1. Middleware Deprecation Warning

2.1 WHEN aplikasi dijalankan dengan Next.js 16.2.4 THEN sistem SHALL NOT menampilkan deprecation warning terkait middleware

2.2 WHEN middleware configuration digunakan THEN sistem SHALL menggunakan konvensi file yang sesuai dengan Next.js 16.2.4 (menggunakan `proxy.ts` atau konfigurasi yang direkomendasikan)

#### 2. Remember Me Feature Working

2.3 WHEN user mencentang checkbox "Remember me" di halaman login THEN sistem SHALL menyimpan state checkbox dan mengatur session persistence

2.4 WHEN user login dengan "Remember me" dicentang THEN sistem SHALL menggunakan Supabase auth dengan `persistSession: true` dan session yang lebih panjang

2.5 WHEN user login tanpa mencentang "Remember me" THEN sistem SHALL menggunakan session default atau session yang lebih pendek

#### 3. File Upload Success

2.6 WHEN authenticated user mengupload file DOCX yang valid untuk konversi Word ke PDF THEN sistem SHALL berhasil mengupload file ke Supabase storage bucket 'uploads'

2.7 WHEN file upload berhasil THEN sistem SHALL melanjutkan proses konversi dan mengembalikan response sukses dengan download URL

2.8 WHEN file upload gagal THEN sistem SHALL memberikan error message yang informatif tentang penyebab kegagalan

#### 4. Download File Triggers Direct Download

2.9 WHEN authenticated user mengklik tombol "Download" pada file hasil konversi THEN sistem SHALL langsung mendownload file ke device user

2.10 WHEN signed URL di-generate untuk download THEN sistem SHALL menyertakan parameter atau header yang memaksa browser untuk download file alih-alih menampilkannya inline

2.11 WHEN download dimulai THEN browser SHALL menampilkan dialog "Save As" atau langsung menyimpan file ke folder Downloads

---

### Unchanged Behavior (Regression Prevention)

#### Authentication & Session Management

3.1 WHEN user login tanpa mencentang "Remember me" THEN sistem SHALL CONTINUE TO mengautentikasi user dengan benar dan membuat session

3.2 WHEN user logout THEN sistem SHALL CONTINUE TO menghapus session dan redirect ke halaman login

#### File Conversion Process

3.3 WHEN unauthenticated user mengupload file untuk konversi THEN sistem SHALL CONTINUE TO memproses konversi dan mengembalikan hasil dalam format base64

3.4 WHEN authenticated user melakukan konversi THEN sistem SHALL CONTINUE TO menyimpan conversion record di database

3.5 WHEN file berhasil dikonversi THEN sistem SHALL CONTINUE TO menyimpan output file di storage bucket 'converted'

#### Middleware Functionality

3.6 WHEN user mengakses protected routes THEN sistem SHALL CONTINUE TO memvalidasi authentication status

3.7 WHEN session cookies perlu diupdate THEN sistem SHALL CONTINUE TO mengupdate cookies dengan benar

#### Download & Storage

3.8 WHEN signed URL di-generate THEN sistem SHALL CONTINUE TO memiliki expiration time (1 jam)

3.9 WHEN user mencoba download file yang sudah dihapus THEN sistem SHALL CONTINUE TO mengembalikan error 404

3.10 WHEN user mencoba download file milik user lain THEN sistem SHALL CONTINUE TO mengembalikan error 403 Forbidden

#### UI & User Experience

3.11 WHEN conversion history ditampilkan THEN sistem SHALL CONTINUE TO menampilkan list conversions dengan pagination

3.12 WHEN file sedang diupload atau dikonversi THEN sistem SHALL CONTINUE TO menampilkan loading indicator

3.13 WHEN error terjadi THEN sistem SHALL CONTINUE TO menampilkan error message yang user-friendly
