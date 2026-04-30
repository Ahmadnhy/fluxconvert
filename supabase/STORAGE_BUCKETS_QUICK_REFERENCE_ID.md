# Kartu Referensi Cepat Storage Bucket

**Task 7.1** - Referensi cepat untuk membuat storage bucket Supabase

---

## Bucket 1: uploads

```
Nama:              uploads
Public:            ❌ OFF (Private)
Batas Ukuran File: 52428800 bytes (50 MB)
```

**Tipe MIME yang Diizinkan** (5 tipe):
```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/msword
image/jpeg
image/png
application/pdf
```

---

## Bucket 2: converted

```
Nama:              converted
Public:            ❌ OFF (Private)
Batas Ukuran File: 104857600 bytes (100 MB)
```

**Tipe MIME yang Diizinkan** (4 tipe):
```
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
```

---

## Langkah Cepat

1. **Supabase Dashboard** → **Storage** → **New bucket**
2. Masukkan nama bucket (huruf kecil, tanpa spasi)
3. **Uncheck** "Public bucket" (tetap private)
4. Masukkan batas ukuran file dalam **bytes**
5. Tambahkan tipe MIME (satu per baris atau dipisah koma)
6. Klik **Create bucket**
7. Ulangi untuk bucket kedua

---

## Checklist Verifikasi

- [ ] Kedua bucket sudah dibuat
- [ ] Kedua bucket **Private** (bukan public)
- [ ] **uploads**: limit 50 MB, 5 tipe MIME
- [ ] **converted**: limit 100 MB, 4 tipe MIME
- [ ] Tidak ada error atau warning

---

## Konversi Ukuran File

| MB | Bytes |
|----|-------|
| 50 MB | 52,428,800 bytes |
| 100 MB | 104,857,600 bytes |

---

## Masalah Umum

**"Bucket name already exists"**
→ Cek apakah bucket sudah dibuat, hapus dan buat ulang jika pengaturan salah

**"Invalid MIME type"**
→ Copy-paste dari kartu referensi ini, cek typo

**"Cannot set file size limit"**
→ Gunakan bytes (bukan MB), lihat tabel konversi di atas

---

**Panduan Lengkap**: Lihat `supabase/STORAGE_BUCKETS_SETUP_ID.md`  
**Requirements**: 6.2, 6.3  
**Task Selanjutnya**: 7.2 (Konfigurasi storage policy)
