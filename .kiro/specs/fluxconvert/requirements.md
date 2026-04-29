# Requirements Document - FluxConvert

## Introduction

FluxConvert adalah website converter file berbasis web yang memungkinkan pengguna untuk mengubah berbagai format file (Word ke PDF, JPG ke PDF, PDF ke JPG), serta menggabungkan dan memisahkan file PDF dengan mudah dan cepat. Sistem ini dibangun menggunakan Next.js 16 dengan App Router, Supabase untuk database dan storage, serta berbagai library processing seperti pdf-lib, sharp, dan mammoth.js.

## Glossary

- **FluxConvert_System**: Keseluruhan aplikasi web file converter
- **File_Upload_Module**: Komponen yang menangani upload file dari user
- **Conversion_Engine**: Modul yang melakukan proses konversi file
- **Word_To_PDF_Converter**: Sub-modul yang mengkonversi file .docx ke PDF
- **Image_To_PDF_Converter**: Sub-modul yang mengkonversi JPG/PNG ke PDF
- **PDF_To_Image_Converter**: Sub-modul yang mengkonversi PDF ke JPG
- **PDF_Merger**: Sub-modul yang menggabungkan multiple PDF files
- **PDF_Splitter**: Sub-modul yang memisahkan halaman PDF
- **Storage_Manager**: Modul yang mengelola file storage di Supabase
- **Authentication_Module**: Modul yang menangani user authentication
- **History_Tracker**: Modul yang mencatat riwayat konversi user
- **File_Validator**: Komponen yang memvalidasi file type dan size
- **Download_Manager**: Modul yang menangani download hasil konversi
- **Temporary_File_Cleaner**: Service yang menghapus temporary files
- **API_Rate_Limiter**: Middleware yang membatasi request rate
- **User**: Pengguna yang menggunakan FluxConvert
- **Guest_User**: Pengguna yang belum login/register
- **Registered_User**: Pengguna yang sudah memiliki akun
- **Conversion_Job**: Satu proses konversi file
- **Original_File**: File yang diupload user untuk dikonversi
- **Converted_File**: File hasil konversi
- **Temporary_File**: File sementara yang disimpan selama proses konversi
- **Conversion_History**: Record riwayat konversi yang dilakukan user
- **Supabase_Storage**: Cloud storage untuk menyimpan files
- **Upload_Bucket**: Storage bucket untuk original files
- **Converted_Bucket**: Storage bucket untuk converted files
- **Temp_Bucket**: Storage bucket untuk temporary processing files

---

## Requirements

### Requirement 1: File Upload dengan Drag & Drop

**User Story:** Sebagai User, saya ingin mengupload file dengan cara drag & drop atau browse, sehingga saya dapat dengan mudah memilih file yang ingin dikonversi.

#### Acceptance Criteria

1. THE File_Upload_Module SHALL menyediakan drop zone area untuk drag & drop files
2. WHEN User melakukan drag file ke drop zone, THE File_Upload_Module SHALL menampilkan visual feedback (highlight border)
3. WHEN User drop file ke drop zone, THE File_Upload_Module SHALL menerima file dan menampilkan preview
4. THE File_Upload_Module SHALL menyediakan tombol browse untuk memilih file dari file system
5. WHEN User memilih file melalui browse button, THE File_Upload_Module SHALL menerima file dan menampilkan preview
6. THE File_Upload_Module SHALL mendukung multiple file upload untuk operasi batch
7. WHEN multiple files diupload, THE File_Upload_Module SHALL menampilkan list semua files dengan preview masing-masing

### Requirement 2: File Type Validation

**User Story:** Sebagai User, saya ingin sistem memvalidasi tipe file yang saya upload, sehingga saya tidak mengupload file yang tidak didukung.

#### Acceptance Criteria

1. WHEN User mengupload file, THE File_Validator SHALL memeriksa file extension
2. THE File_Validator SHALL menerima file dengan extension: .docx, .jpg, .jpeg, .png, .pdf
3. IF User mengupload file dengan extension yang tidak didukung, THEN THE File_Validator SHALL menolak file dan menampilkan error message yang deskriptif
4. WHEN User mengupload file, THE File_Validator SHALL memeriksa MIME type dari file
5. IF MIME type tidak sesuai dengan extension, THEN THE File_Validator SHALL menolak file dan menampilkan warning tentang file mismatch
6. THE File_Validator SHALL memvalidasi bahwa file bukan file corrupt dengan memeriksa file header
7. IF file corrupt terdeteksi, THEN THE File_Validator SHALL menampilkan error message "File corrupt atau tidak dapat dibaca"

### Requirement 3: File Size Limitation

**User Story:** Sebagai System Administrator, saya ingin membatasi ukuran file yang dapat diupload, sehingga server tidak overload dengan file yang terlalu besar.

#### Acceptance Criteria

1. THE File_Validator SHALL menetapkan maximum file size limit sebesar 50 MB per file
2. WHEN User mengupload file, THE File_Validator SHALL memeriksa file size
3. IF file size melebihi 50 MB, THEN THE File_Validator SHALL menolak file dan menampilkan error message "File size exceeds 50 MB limit"
4. WHEN multiple files diupload, THE File_Validator SHALL memvalidasi setiap file secara individual
5. THE File_Upload_Module SHALL menampilkan file size information untuk setiap uploaded file

### Requirement 4: Word to PDF Conversion

**User Story:** Sebagai User, saya ingin mengkonversi file Word (.docx) ke PDF, sehingga saya dapat membagikan dokumen dalam format universal.

#### Acceptance Criteria

1. WHEN User memilih Word to PDF conversion dan mengupload .docx file, THE Word_To_PDF_Converter SHALL memproses file menggunakan mammoth.js
2. THE Word_To_PDF_Converter SHALL mengekstrak content, formatting, dan images dari .docx file
3. THE Word_To_PDF_Converter SHALL menghasilkan PDF file yang mempertahankan formatting original document
4. WHEN conversion selesai, THE Word_To_PDF_Converter SHALL menyimpan hasil ke Converted_Bucket
5. THE Word_To_PDF_Converter SHALL memproses file dalam waktu maksimal 30 detik untuk file berukuran 10 MB
6. IF conversion gagal, THEN THE Word_To_PDF_Converter SHALL menampilkan error message yang deskriptif
7. THE Word_To_PDF_Converter SHALL mendukung .docx files yang dibuat dengan Microsoft Word 2007 atau lebih baru

### Requirement 5: Image to PDF Conversion

**User Story:** Sebagai User, saya ingin mengkonversi gambar JPG/PNG ke PDF, sehingga saya dapat menggabungkan multiple images dalam satu dokumen PDF.

#### Acceptance Criteria

1. WHEN User memilih Image to PDF conversion dan mengupload JPG atau PNG files, THE Image_To_PDF_Converter SHALL memproses images menggunakan sharp dan pdf-lib
2. THE Image_To_PDF_Converter SHALL menyediakan opsi page size: A4, Letter
3. THE Image_To_PDF_Converter SHALL menyediakan opsi orientation: Portrait, Landscape
4. WHEN User memilih page size dan orientation, THE Image_To_PDF_Converter SHALL mengatur PDF layout sesuai pilihan
5. THE Image_To_PDF_Converter SHALL mempertahankan aspect ratio original image
6. WHEN multiple images diupload, THE Image_To_PDF_Converter SHALL membuat satu PDF dengan setiap image pada halaman terpisah
7. THE Image_To_PDF_Converter SHALL mengoptimasi image quality untuk mengurangi file size tanpa kehilangan kualitas visual yang signifikan
8. WHEN conversion selesai, THE Image_To_PDF_Converter SHALL menyimpan hasil ke Converted_Bucket

### Requirement 6: PDF to Image Conversion

**User Story:** Sebagai User, saya ingin mengkonversi PDF ke gambar JPG, sehingga saya dapat menggunakan halaman PDF sebagai image files.

#### Acceptance Criteria

1. WHEN User memilih PDF to JPG conversion dan mengupload PDF file, THE PDF_To_Image_Converter SHALL memproses PDF menggunakan pdf-lib
2. THE PDF_To_Image_Converter SHALL menyediakan opsi image quality: Low (72 DPI), Medium (150 DPI), High (300 DPI)
3. WHEN User memilih quality setting, THE PDF_To_Image_Converter SHALL menghasilkan JPG dengan DPI sesuai pilihan
4. THE PDF_To_Image_Converter SHALL mengkonversi setiap halaman PDF menjadi separate JPG file
5. WHEN PDF memiliki multiple pages, THE PDF_To_Image_Converter SHALL membuat ZIP file berisi semua JPG files
6. THE PDF_To_Image_Converter SHALL memberi nama file output dengan format: {original_name}_page_{number}.jpg
7. WHEN conversion selesai, THE PDF_To_Image_Converter SHALL menyimpan hasil ke Converted_Bucket

### Requirement 7: Merge PDF Files

**User Story:** Sebagai User, saya ingin menggabungkan multiple PDF files menjadi satu PDF, sehingga saya dapat mengorganisir dokumen-dokumen terkait dalam satu file.

#### Acceptance Criteria

1. WHEN User memilih Merge PDF dan mengupload multiple PDF files, THE PDF_Merger SHALL memproses files menggunakan pdf-lib
2. THE PDF_Merger SHALL menggabungkan PDF files sesuai urutan yang ditentukan User
3. THE PDF_Merger SHALL menyediakan drag & drop interface untuk mengatur urutan PDF files sebelum merge
4. WHEN User mengubah urutan files, THE PDF_Merger SHALL memperbarui preview urutan secara real-time
5. THE PDF_Merger SHALL mempertahankan semua content, formatting, dan metadata dari original PDFs
6. THE PDF_Merger SHALL mendukung merge hingga 20 PDF files dalam satu operasi
7. WHEN merge selesai, THE PDF_Merger SHALL menyimpan hasil ke Converted_Bucket
8. THE PDF_Merger SHALL memberi nama file output dengan format: merged_{timestamp}.pdf

### Requirement 8: Split PDF File

**User Story:** Sebagai User, saya ingin memisahkan halaman-halaman dari PDF file, sehingga saya dapat mengekstrak halaman tertentu atau membagi PDF besar menjadi bagian-bagian kecil.

#### Acceptance Criteria

1. WHEN User memilih Split PDF dan mengupload PDF file, THE PDF_Splitter SHALL menampilkan preview semua halaman
2. THE PDF_Splitter SHALL menyediakan opsi untuk memilih halaman-halaman yang ingin diekstrak
3. THE PDF_Splitter SHALL menyediakan opsi untuk split by page range (contoh: pages 1-5, 10-15)
4. THE PDF_Splitter SHALL menyediakan opsi untuk split setiap halaman menjadi separate PDF
5. WHEN User memilih halaman tertentu, THE PDF_Splitter SHALL mengekstrak halaman tersebut menggunakan pdf-lib
6. WHEN split selesai dan menghasilkan multiple PDFs, THE PDF_Splitter SHALL membuat ZIP file berisi semua PDF files
7. THE PDF_Splitter SHALL memberi nama file output dengan format: {original_name}_pages_{range}.pdf
8. WHEN split selesai, THE PDF_Splitter SHALL menyimpan hasil ke Converted_Bucket

### Requirement 9: Conversion Progress Indicator

**User Story:** Sebagai User, saya ingin melihat progress konversi file, sehingga saya tahu berapa lama lagi proses akan selesai.

#### Acceptance Criteria

1. WHEN Conversion_Engine memulai proses konversi, THE FluxConvert_System SHALL menampilkan progress bar
2. THE FluxConvert_System SHALL memperbarui progress percentage secara real-time selama konversi
3. THE FluxConvert_System SHALL menampilkan status message yang deskriptif (contoh: "Uploading...", "Converting...", "Finalizing...")
4. WHEN konversi selesai, THE FluxConvert_System SHALL menampilkan success message dan tombol download
5. THE FluxConvert_System SHALL menampilkan estimated time remaining berdasarkan file size dan conversion type
6. WHILE konversi berlangsung, THE FluxConvert_System SHALL mencegah User meninggalkan halaman tanpa konfirmasi

### Requirement 10: Download Converted Files

**User Story:** Sebagai User, saya ingin mendownload hasil konversi, sehingga saya dapat menggunakan file yang telah dikonversi.

#### Acceptance Criteria

1. WHEN konversi selesai, THE Download_Manager SHALL menampilkan tombol download
2. WHEN User mengklik tombol download, THE Download_Manager SHALL memulai download file secara otomatis
3. THE Download_Manager SHALL menyediakan opsi untuk download langsung atau save to cloud storage
4. THE Download_Manager SHALL menampilkan file information: nama file, ukuran, dan format
5. WHEN download selesai, THE Download_Manager SHALL menampilkan konfirmasi success
6. THE Download_Manager SHALL menyediakan opsi untuk share download link dengan expiry time 24 jam
7. IF download gagal, THEN THE Download_Manager SHALL menyediakan tombol retry

### Requirement 11: User Registration

**User Story:** Sebagai Guest_User, saya ingin membuat akun, sehingga saya dapat menyimpan riwayat konversi dan mengakses fitur tambahan.

#### Acceptance Criteria

1. THE Authentication_Module SHALL menyediakan registration form dengan fields: email, password, confirm password
2. WHEN User mengisi registration form, THE Authentication_Module SHALL memvalidasi email format
3. WHEN User mengisi registration form, THE Authentication_Module SHALL memvalidasi password strength (minimum 8 karakter, mengandung huruf dan angka)
4. IF password dan confirm password tidak match, THEN THE Authentication_Module SHALL menampilkan error message
5. WHEN User submit registration form, THE Authentication_Module SHALL membuat user account di Supabase
6. WHEN registration berhasil, THE Authentication_Module SHALL mengirim verification email ke User
7. THE Authentication_Module SHALL mencegah duplicate email registration
8. IF email sudah terdaftar, THEN THE Authentication_Module SHALL menampilkan error message "Email already registered"

### Requirement 12: User Login

**User Story:** Sebagai Registered_User, saya ingin login ke akun saya, sehingga saya dapat mengakses fitur yang memerlukan authentication.

#### Acceptance Criteria

1. THE Authentication_Module SHALL menyediakan login form dengan fields: email, password
2. WHEN User mengisi login form dan submit, THE Authentication_Module SHALL memverifikasi credentials dengan Supabase
3. IF credentials valid, THEN THE Authentication_Module SHALL membuat session dan redirect User ke dashboard
4. IF credentials invalid, THEN THE Authentication_Module SHALL menampilkan error message "Invalid email or password"
5. THE Authentication_Module SHALL menyediakan "Remember Me" option untuk persistent session
6. THE Authentication_Module SHALL menyediakan "Forgot Password" link untuk password reset
7. WHEN User berhasil login, THE Authentication_Module SHALL menyimpan session token securely

### Requirement 13: Conversion History Tracking

**User Story:** Sebagai Registered_User, saya ingin melihat riwayat konversi yang pernah saya lakukan, sehingga saya dapat mengakses kembali file-file yang pernah dikonversi.

#### Acceptance Criteria

1. WHEN Registered_User melakukan konversi, THE History_Tracker SHALL menyimpan conversion record ke database
2. THE History_Tracker SHALL menyimpan informasi: original filename, conversion type, converted filename, timestamp, file size
3. THE History_Tracker SHALL menyediakan halaman Conversion History untuk Registered_User
4. WHEN Registered_User membuka Conversion History, THE History_Tracker SHALL menampilkan list semua konversi yang pernah dilakukan
5. THE History_Tracker SHALL menampilkan konversi dalam urutan terbaru terlebih dahulu
6. THE History_Tracker SHALL menyediakan filter berdasarkan conversion type
7. THE History_Tracker SHALL menyediakan search functionality untuk mencari berdasarkan filename
8. WHEN Registered_User mengklik conversion record, THE History_Tracker SHALL menyediakan opsi untuk download ulang converted file

### Requirement 14: Temporary File Management

**User Story:** Sebagai System Administrator, saya ingin sistem otomatis menghapus temporary files, sehingga storage tidak penuh dengan file-file yang tidak terpakai.

#### Acceptance Criteria

1. WHEN Conversion_Engine memproses file, THE Storage_Manager SHALL menyimpan temporary files ke Temp_Bucket
2. THE Temporary_File_Cleaner SHALL berjalan sebagai scheduled job setiap 1 jam
3. WHEN Temporary_File_Cleaner berjalan, THE Temporary_File_Cleaner SHALL mengidentifikasi files yang lebih tua dari 2 jam
4. THE Temporary_File_Cleaner SHALL menghapus files dari Temp_Bucket yang sudah lebih dari 2 jam
5. THE Temporary_File_Cleaner SHALL menghapus converted files dari Converted_Bucket yang sudah lebih dari 24 jam
6. THE Temporary_File_Cleaner SHALL mencatat log setiap file yang dihapus
7. IF penghapusan file gagal, THEN THE Temporary_File_Cleaner SHALL mencatat error log dan retry pada job berikutnya

### Requirement 15: API Rate Limiting

**User Story:** Sebagai System Administrator, saya ingin membatasi jumlah request per user, sehingga sistem tidak disalahgunakan dan tetap available untuk semua users.

#### Acceptance Criteria

1. THE API_Rate_Limiter SHALL membatasi Guest_User maksimal 5 conversions per jam
2. THE API_Rate_Limiter SHALL membatasi Registered_User maksimal 20 conversions per jam
3. WHEN User mencapai rate limit, THE API_Rate_Limiter SHALL menolak request dan mengembalikan HTTP status 429
4. WHEN User mencapai rate limit, THE FluxConvert_System SHALL menampilkan error message dengan informasi kapan User dapat melakukan conversion lagi
5. THE API_Rate_Limiter SHALL menggunakan IP address untuk tracking Guest_User
6. THE API_Rate_Limiter SHALL menggunakan user ID untuk tracking Registered_User
7. THE API_Rate_Limiter SHALL mereset counter setiap 1 jam

### Requirement 16: Error Handling dan Notification

**User Story:** Sebagai User, saya ingin menerima notifikasi yang jelas ketika terjadi error, sehingga saya tahu apa yang salah dan bagaimana cara memperbaikinya.

#### Acceptance Criteria

1. WHEN error terjadi di Conversion_Engine, THE FluxConvert_System SHALL menampilkan error notification dengan message yang deskriptif
2. THE FluxConvert_System SHALL mengkategorikan error: validation error, conversion error, network error, server error
3. WHEN validation error terjadi, THE FluxConvert_System SHALL menampilkan specific field error di form
4. WHEN conversion error terjadi, THE FluxConvert_System SHALL menampilkan error message dengan saran troubleshooting
5. WHEN network error terjadi, THE FluxConvert_System SHALL menampilkan retry button
6. THE FluxConvert_System SHALL mencatat semua errors ke logging system untuk debugging
7. THE FluxConvert_System SHALL menampilkan error notification dengan auto-dismiss setelah 5 detik untuk non-critical errors

### Requirement 17: Responsive Design

**User Story:** Sebagai User, saya ingin mengakses FluxConvert dari berbagai devices, sehingga saya dapat melakukan konversi dari desktop, tablet, atau mobile.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL mengimplementasikan responsive design menggunakan Tailwind CSS
2. THE FluxConvert_System SHALL mendukung viewport sizes: mobile (320px - 767px), tablet (768px - 1023px), desktop (1024px+)
3. WHEN User mengakses dari mobile device, THE FluxConvert_System SHALL menyesuaikan layout untuk single column
4. WHEN User mengakses dari tablet, THE FluxConvert_System SHALL menyesuaikan layout untuk optimal tablet viewing
5. WHEN User mengakses dari desktop, THE FluxConvert_System SHALL menampilkan full layout dengan multiple columns
6. THE FluxConvert_System SHALL memastikan semua interactive elements (buttons, dropzone) mudah diakses di touch devices
7. THE FluxConvert_System SHALL mengoptimasi image dan asset loading berdasarkan device capabilities

### Requirement 18: File Name Sanitization

**User Story:** Sebagai System Administrator, saya ingin sistem membersihkan nama file dari karakter berbahaya, sehingga tidak terjadi security vulnerability.

#### Acceptance Criteria

1. WHEN User mengupload file, THE Storage_Manager SHALL sanitize filename
2. THE Storage_Manager SHALL menghapus karakter special: /, \, :, *, ?, ", <, >, |
3. THE Storage_Manager SHALL mengganti spaces dengan underscore
4. THE Storage_Manager SHALL membatasi panjang filename maksimal 255 karakter
5. THE Storage_Manager SHALL mempertahankan file extension original
6. THE Storage_Manager SHALL menambahkan unique identifier (timestamp atau UUID) untuk mencegah filename collision
7. IF filename setelah sanitization kosong, THEN THE Storage_Manager SHALL menggunakan default name: "file_{timestamp}"

### Requirement 19: Supabase Storage Integration

**User Story:** Sebagai Developer, saya ingin mengintegrasikan Supabase Storage untuk menyimpan files, sehingga file management scalable dan reliable.

#### Acceptance Criteria

1. THE Storage_Manager SHALL membuat koneksi ke Supabase Storage menggunakan Supabase client
2. THE Storage_Manager SHALL menggunakan tiga storage buckets: uploads, converted, temp
3. WHEN User mengupload file, THE Storage_Manager SHALL menyimpan file ke uploads bucket
4. WHEN conversion selesai, THE Storage_Manager SHALL menyimpan hasil ke converted bucket
5. WHILE conversion berlangsung, THE Storage_Manager SHALL menyimpan temporary files ke temp bucket
6. THE Storage_Manager SHALL mengatur bucket policies: uploads (private), converted (private dengan signed URL), temp (private)
7. WHEN User request download, THE Storage_Manager SHALL generate signed URL dengan expiry 1 jam
8. THE Storage_Manager SHALL handle storage errors dan retry failed uploads maksimal 3 kali

### Requirement 20: Loading Animation dan UI Feedback

**User Story:** Sebagai User, saya ingin melihat loading animation dan feedback visual, sehingga saya tahu sistem sedang memproses request saya.

#### Acceptance Criteria

1. WHEN User melakukan action yang memerlukan processing time, THE FluxConvert_System SHALL menampilkan loading animation
2. THE FluxConvert_System SHALL menggunakan framer-motion untuk smooth animations
3. WHEN file sedang diupload, THE FluxConvert_System SHALL menampilkan upload progress bar
4. WHEN conversion sedang berlangsung, THE FluxConvert_System SHALL menampilkan animated spinner atau progress indicator
5. WHEN User hover pada interactive elements, THE FluxConvert_System SHALL menampilkan hover effect
6. WHEN User click button, THE FluxConvert_System SHALL menampilkan click feedback (scale animation atau color change)
7. THE FluxConvert_System SHALL menampilkan skeleton loading untuk content yang sedang dimuat

---

## Notes

- Semua conversion operations harus dilakukan secara asynchronous untuk mencegah blocking UI
- Security adalah prioritas: validasi input, sanitize filenames, rate limiting, dan secure storage
- Performance optimization penting: lazy loading, image optimization, efficient file processing
- User experience harus smooth: loading states, error handling, progress indicators
- Semua API endpoints harus protected dengan proper authentication dan authorization
- Database schema dan storage buckets harus sudah disetup di Supabase sebelum development dimulai
