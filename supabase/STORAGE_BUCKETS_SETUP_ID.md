# Panduan Setup Storage Bucket Supabase

Panduan ini memberikan instruksi langkah demi langkah untuk membuat dan mengkonfigurasi storage bucket yang diperlukan untuk fungsi penyimpanan file aplikasi FluxConvert.

## Gambaran Umum

Aplikasi FluxConvert memerlukan dua storage bucket di Supabase:

1. **uploads** - Menyimpan file input yang diupload user (dokumen Word, gambar, dll.)
2. **converted** - Menyimpan file output hasil konversi (PDF, gambar terkonversi, dll.)

Kedua bucket dikonfigurasi sebagai **private** untuk memastikan penyimpanan file yang aman dengan akses dikontrol melalui signed URL.

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- ✅ Project Supabase sudah dibuat untuk FluxConvert
- ✅ Akses ke Supabase Dashboard
- ✅ Permission Admin/Owner pada project Supabase

---

## Langkah 1: Akses Storage di Supabase Dashboard

1. Login ke Supabase Dashboard Anda di https://supabase.com/dashboard
2. Pilih project FluxConvert Anda
3. Di sidebar kiri, klik **Storage** (ikon terlihat seperti folder)
4. Anda harus melihat interface Storage dengan daftar bucket yang ada (jika ada)

---

## Langkah 2: Buat Bucket 'uploads'

### 2.1 Mulai Pembuatan Bucket

1. Klik tombol **"New bucket"** (biasanya di pojok kanan atas)
2. Dialog modal akan muncul dengan judul "Create a new bucket"

### 2.2 Konfigurasi Pengaturan Bucket

Isi pengaturan berikut:

| Pengaturan | Nilai | Deskripsi |
|---------|-------|-------------|
| **Name** | `uploads` | Identifier bucket (harus huruf kecil, tanpa spasi) |
| **Public bucket** | ❌ **OFF** (tidak dicentang) | Jaga file tetap private - akses via signed URL saja |
| **File size limit** | `52428800` bytes (50 MB) | Ukuran file maksimum: 50 MB |
| **Allowed MIME types** | Lihat di bawah | Batasi ke tipe file spesifik |

### 2.3 Konfigurasi Tipe MIME yang Diizinkan

Di field "Allowed MIME types", masukkan tipe MIME berikut (satu per baris atau dipisah koma):

```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/msword
image/jpeg
image/png
application/pdf
```

**Apa yang diizinkan tipe MIME ini:**
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - file .docx (Word 2007+)
- `application/msword` - file .doc (dokumen Word lama)
- `image/jpeg` - file gambar .jpg, .jpeg
- `image/png` - file gambar .png
- `application/pdf` - file .pdf

### 2.4 Buat Bucket

1. Review semua pengaturan untuk memastikan cocok dengan spesifikasi di atas
2. Klik tombol **"Create bucket"**
3. Anda harus melihat pesan sukses
4. Bucket 'uploads' sekarang harus muncul di daftar bucket Anda

### 2.5 Verifikasi Pembuatan Bucket

Untuk memverifikasi bucket dibuat dengan benar:

1. Klik bucket **uploads** di daftar
2. Cek panel detail bucket (biasanya di sisi kanan):
   - ✅ Public: **OFF**
   - ✅ File size limit: **50 MB** (52428800 bytes)
   - ✅ Allowed MIME types: Menampilkan 5 tipe yang Anda konfigurasi

---

## Langkah 3: Buat Bucket 'converted'

### 3.1 Mulai Pembuatan Bucket

1. Klik tombol **"New bucket"** lagi
2. Dialog modal akan muncul dengan judul "Create a new bucket"

### 3.2 Konfigurasi Pengaturan Bucket

Isi pengaturan berikut:

| Pengaturan | Nilai | Deskripsi |
|---------|-------|-------------|
| **Name** | `converted` | Identifier bucket (harus huruf kecil, tanpa spasi) |
| **Public bucket** | ❌ **OFF** (tidak dicentang) | Jaga file tetap private - akses via signed URL saja |
| **File size limit** | `104857600` bytes (100 MB) | Ukuran file maksimum: 100 MB |
| **Allowed MIME types** | Lihat di bawah | Batasi ke tipe file spesifik |

### 3.3 Konfigurasi Tipe MIME yang Diizinkan

Di field "Allowed MIME types", masukkan tipe MIME berikut:

```
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
```

**Apa yang diizinkan tipe MIME ini:**
- `application/pdf` - file .pdf (format output utama)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - file .docx
- `image/jpeg` - file gambar .jpg, .jpeg
- `image/png` - file gambar .png

### 3.4 Buat Bucket

1. Review semua pengaturan untuk memastikan cocok dengan spesifikasi di atas
2. Klik tombol **"Create bucket"**
3. Anda harus melihat pesan sukses
4. Bucket 'converted' sekarang harus muncul di daftar bucket Anda

### 3.5 Verifikasi Pembuatan Bucket

Untuk memverifikasi bucket dibuat dengan benar:

1. Klik bucket **converted** di daftar
2. Cek panel detail bucket:
   - ✅ Public: **OFF**
   - ✅ File size limit: **100 MB** (104857600 bytes)
   - ✅ Allowed MIME types: Menampilkan 4 tipe yang Anda konfigurasi

---

## Langkah 4: Verifikasi Kedua Bucket

Setelah membuat kedua bucket, verifikasi setup Storage Anda:

1. Di interface Storage, Anda harus melihat **dua bucket** terdaftar:
   - ✅ **uploads** (Private, limit 50 MB)
   - ✅ **converted** (Private, limit 100 MB)

2. Kedua bucket harus menampilkan:
   - 🔒 Indikator **Private** (ikon gembok atau label "Private")
   - 📦 **0 objects** (kosong, karena belum ada file yang diupload)

---

## Langkah 5: Memahami Konfigurasi Bucket

### Mengapa Bucket Private?

Kedua bucket dikonfigurasi sebagai **private** untuk alasan keamanan:

- **Kontrol Akses**: Hanya user yang terautentikasi yang bisa mengakses file mereka sendiri
- **Signed URL**: File diakses via signed URL dengan batas waktu (kadaluarsa 1 jam)
- **Privasi Data**: Mencegah akses tidak sah ke file user
- **Kepatuhan**: Memenuhi persyaratan perlindungan data

### Penjelasan Batas Ukuran File

| Bucket | Limit | Alasan |
|--------|-------|--------|
| **uploads** | 50 MB | File input biasanya lebih kecil; mencegah penyalahgunaan |
| **converted** | 100 MB | File output (terutama PDF) bisa lebih besar dari input |

### Pembatasan Tipe MIME

Pembatasan tipe MIME memberikan:

- **Keamanan**: Mencegah upload file executable atau konten berbahaya
- **Validasi**: Memastikan hanya tipe file yang didukung yang disimpan
- **Optimasi Storage**: Membatasi storage ke tipe file yang relevan

---

## Langkah 6: Langkah Selanjutnya - Storage Policy

Setelah membuat bucket, Anda perlu mengkonfigurasi **Storage Policy** untuk mengontrol akses. Ini dibahas di **Task 7.2**.

Storage policy akan mendefinisikan:

- Siapa yang bisa upload file ke setiap bucket
- Siapa yang bisa baca/download file dari setiap bucket
- Siapa yang bisa hapus file dari setiap bucket

**Penting**: Tanpa storage policy, bahkan user yang terautentikasi tidak bisa mengakses bucket. Task 7.2 harus diselesaikan sebelum aplikasi bisa menggunakan bucket ini.

---

## Troubleshooting

### Masalah: "Bucket name already exists"

**Solusi**: 
- Nama bucket harus unik dalam project Supabase Anda
- Jika Anda melihat error ini, bucket mungkin sudah ada
- Cek daftar bucket Anda untuk melihat apakah sudah dibuat
- Jika ada dengan pengaturan salah, hapus dan buat ulang

### Masalah: "Invalid MIME type format"

**Solusi**:
- Pastikan tipe MIME dimasukkan dengan benar (tanpa typo)
- Gunakan format yang tepat: `type/subtype` (contoh: `application/pdf`)
- Pisahkan multiple tipe MIME dengan koma atau baris baru
- Tidak ada spasi ekstra sebelum atau sesudah tipe MIME

### Masalah: "Cannot set file size limit"

**Solusi**:
- Batas ukuran file dalam **bytes**, bukan MB
- 50 MB = 52,428,800 bytes
- 100 MB = 104,857,600 bytes
- Beberapa versi UI Supabase mungkin menampilkan MB langsung - gunakan nilai yang sesuai

### Masalah: "Bucket created but not visible"

**Solusi**:
- Refresh halaman Storage di browser Anda
- Cek Anda berada di project Supabase yang benar
- Tunggu beberapa detik - pembuatan bucket mungkin butuh waktu
- Cek console browser untuk error

### Masalah: "Public bucket toggle not available"

**Solusi**:
- Pastikan Anda memiliki permission admin/owner pada project
- Beberapa plan Supabase mungkin memiliki pembatasan
- Default adalah private, yang memang kita inginkan

---

## Checklist Verifikasi

Sebelum melanjutkan ke Task 7.2, verifikasi:

- [ ] Bucket **uploads** ada
- [ ] Bucket **uploads** adalah **private** (bukan public)
- [ ] Bucket **uploads** memiliki batas ukuran file **50 MB**
- [ ] Bucket **uploads** memiliki **5 tipe MIME yang diizinkan** dikonfigurasi
- [ ] Bucket **converted** ada
- [ ] Bucket **converted** adalah **private** (bukan public)
- [ ] Bucket **converted** memiliki batas ukuran file **100 MB**
- [ ] Bucket **converted** memiliki **4 tipe MIME yang diizinkan** dikonfigurasi
- [ ] Kedua bucket muncul di interface Storage
- [ ] Tidak ada error atau warning ditampilkan untuk kedua bucket

---

## Referensi Screenshot

Meskipun panduan ini tidak menyertakan screenshot aktual, berikut yang harus Anda lihat di setiap langkah:

### Tampilan Storage Dashboard
```
┌─────────────────────────────────────────────────┐
│ Storage                          [New bucket]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📦 uploads          Private    0 objects       │
│  📦 converted        Private    0 objects       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Modal Pembuatan Bucket
```
┌─────────────────────────────────────────────────┐
│ Create a new bucket                      [X]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name: [uploads                        ]        │
│                                                 │
│  ☐ Public bucket                                │
│                                                 │
│  File size limit (bytes): [52428800    ]        │
│                                                 │
│  Allowed MIME types:                            │
│  [application/vnd.openxmlformats-...   ]        │
│  [application/msword                   ]        │
│  [image/jpeg                           ]        │
│  [image/png                            ]        │
│  [application/pdf                      ]        │
│                                                 │
│                    [Cancel] [Create bucket]     │
└─────────────────────────────────────────────────┘
```

---

## Catatan Tambahan

### Konvensi Penamaan Bucket

- Nama bucket harus **huruf kecil**
- Tanpa spasi atau karakter khusus (kecuali tanda hubung)
- Harus unik dalam project Supabase Anda
- Tidak bisa diubah setelah dibuat (harus hapus dan buat ulang)

### Batas Storage

- Tier gratis Supabase termasuk **1 GB** storage
- Tier Pro termasuk **100 GB** storage
- Monitor penggunaan di **Settings** > **Usage**
- Setup alert untuk penggunaan storage di production

### Organisasi File

File di bucket akan diorganisir berdasarkan user ID:

```
uploads/
  ├── {user-id-1}/
  │   ├── {timestamp}-document.docx
  │   └── {timestamp}-image.jpg
  └── {user-id-2}/
      └── {timestamp}-document.docx

converted/
  ├── {user-id-1}/
  │   ├── {timestamp}-document.pdf
  │   └── {timestamp}-image.pdf
  └── {user-id-2}/
      └── {timestamp}-document.pdf
```

Organisasi ini:
- Mengisolasi file user untuk keamanan
- Menyederhanakan policy kontrol akses
- Membuat pembersihan dan manajemen lebih mudah

---

## Dokumentasi Terkait

- **Task 7.2**: Konfigurasi storage policy (langkah selanjutnya)
- **SUPABASE_SETUP.md**: Panduan setup Supabase lengkap
- **supabase/schema.sql**: Skema database termasuk tabel files
- **Dokumen Desain**: Arsitektur storage dan alur data

---

## Ringkasan

Anda telah berhasil membuat dua storage bucket:

1. ✅ **uploads** - Private, limit 50 MB, 5 tipe MIME
2. ✅ **converted** - Private, limit 100 MB, 4 tipe MIME

**Langkah Selanjutnya**: Lanjutkan ke **Task 7.2** untuk mengkonfigurasi storage policy yang mengontrol akses ke bucket ini.

---

## Support

Jika Anda mengalami masalah yang tidak tercakup dalam panduan ini:

1. Cek dokumentasi Supabase Storage: https://supabase.com/docs/guides/storage
2. Review tooltip bantuan Supabase Dashboard (hover di atas ikon ?)
3. Cek komunitas Discord Supabase: https://discord.supabase.com
4. Verifikasi plan project Supabase Anda termasuk fitur Storage

---

**Versi Dokumen**: 1.0  
**Terakhir Diupdate**: Implementasi Task 7.1  
**Requirements Terkait**: 6.2, 6.3
