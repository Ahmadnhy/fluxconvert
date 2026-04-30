# Panduan Setup Vercel Cron Job

## Gambaran Umum

Panduan ini menjelaskan cara mengkonfigurasi Vercel Cron job untuk pembersihan file otomatis di aplikasi FluxConvert. Cron job akan berjalan setiap hari pada pukul 2:00 pagi UTC untuk menghapus file yang lebih lama dari 7 hari dari Supabase Storage.

## File Konfigurasi

### vercel.json

File `vercel.json` di root project berisi konfigurasi cron job:

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

**Detail Konfigurasi:**
- **path**: Endpoint API yang akan dipanggil oleh cron job (`/api/cron/cleanup`)
- **schedule**: Ekspresi cron untuk eksekusi harian pada pukul 2:00 pagi UTC (`0 2 * * *`)

### Format Jadwal Cron

Jadwal menggunakan sintaks cron standar:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Hari dalam minggu (0-7, Minggu = 0 atau 7)
│ │ │ └───── Bulan (1-12)
│ │ └─────── Tanggal (1-31)
│ └───────── Jam (0-23)
└─────────── Menit (0-59)
```

**Jadwal Saat Ini:** `0 2 * * *`
- Menit: 0 (tepat di awal jam)
- Jam: 2 (pukul 2:00 pagi)
- Tanggal: * (setiap hari)
- Bulan: * (setiap bulan)
- Hari dalam minggu: * (setiap hari dalam seminggu)

**Hasil:** Berjalan setiap hari pada pukul 2:00 pagi UTC

## Setup Environment Variable

### Development Lokal

1. **Generate secret acak yang aman:**

   Menggunakan Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Menggunakan OpenSSL:
   ```bash
   openssl rand -hex 32
   ```

2. **Tambahkan ke `.env.local`:**

   ```env
   CRON_SECRET=secret_yang_anda_generate_disini
   ```

   **Penting:** Jangan pernah commit file ini ke version control. File ini sudah ada di `.gitignore`.

### Setup Production Vercel

1. **Buka dashboard project Vercel Anda**
   - Pergi ke https://vercel.com/dashboard
   - Pilih project FluxConvert Anda

2. **Buka pengaturan Environment Variables**
   - Klik tab "Settings"
   - Klik "Environment Variables" di sidebar

3. **Tambahkan variable CRON_SECRET**
   - Klik tombol "Add New"
   - **Key:** `CRON_SECRET`
   - **Value:** Secret acak yang aman (gunakan perintah yang sama seperti di atas untuk generate)
   - **Environment:** Pilih "Production" (dan opsional "Preview" dan "Development")
   - Klik "Save"

4. **Deploy ulang aplikasi Anda**
   - Setelah menambahkan environment variable, deploy ulang aplikasi agar perubahan berlaku
   - Pergi ke tab "Deployments"
   - Klik "Redeploy" pada deployment terbaru

## Cara Kerjanya

### Alur Eksekusi

1. **Trigger Vercel Cron**
   - Pada pukul 2:00 pagi UTC setiap hari, Vercel otomatis mengirim POST request ke `/api/cron/cleanup`
   - Vercel menyertakan `CRON_SECRET` di header `Authorization` sebagai `Bearer <CRON_SECRET>`

2. **Autentikasi**
   - Endpoint memverifikasi header `Authorization` cocok dengan `CRON_SECRET` yang dikonfigurasi
   - Jika tidak valid atau hilang, mengembalikan 401 Unauthorized
   - Jika tidak dikonfigurasi, mengembalikan 500 Server Error

3. **Eksekusi Pembersihan**
   - Memanggil `cleanupOldFiles()` dari `src/lib/jobs/fileCleanup.ts`
   - Query file yang lebih lama dari 7 hari dengan status 'active'
   - Proses file dalam batch 100
   - Untuk setiap file:
     - Hapus dari Supabase Storage (bucket 'uploads' dan 'converted')
     - Update status file menjadi 'deleted' di database
     - Log error yang terjadi

4. **Response**
   - Mengembalikan ringkasan dengan:
     - Total file yang diproses
     - Jumlah yang berhasil dihapus
     - Jumlah yang gagal
     - Detail error untuk penghapusan yang gagal

### Keamanan

- **Proteksi CRON_SECRET:** Mencegah akses tidak sah ke endpoint pembersihan
- **Bearer Token:** Menggunakan autentikasi Bearer token standar
- **Spesifik Environment:** Gunakan secret berbeda untuk setiap environment
- **Jangan Commit:** Jaga secret tetap di luar version control

## Testing

### Testing Lokal

Test endpoint secara lokal menggunakan curl:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer cron_secret_dari_env_local_anda"
```

**Response yang Diharapkan (Sukses):**
```json
{
  "success": true,
  "summary": {
    "totalProcessed": 15,
    "successfullyDeleted": 14,
    "failed": 1,
    "errors": [
      {
        "fileId": "abc-123",
        "fileName": "example.pdf",
        "error": "Failed to delete from storage"
      }
    ]
  }
}
```

### Testing Production

Setelah deployment, Anda bisa trigger cron job secara manual:

1. **Menggunakan Vercel CLI:**
   ```bash
   vercel env pull .env.production.local
   curl -X POST https://your-app.vercel.app/api/cron/cleanup \
     -H "Authorization: Bearer $(grep CRON_SECRET .env.production.local | cut -d '=' -f2)"
   ```

2. **Menggunakan Vercel Dashboard:**
   - Pergi ke bagian "Cron Jobs" project Anda
   - Temukan cleanup job
   - Klik "Run Now" untuk trigger eksekusi manual

## Monitoring

### Vercel Logs

Monitor eksekusi cron job di Vercel:

1. Pergi ke dashboard project Anda
2. Klik tab "Logs"
3. Filter berdasarkan function: `/api/cron/cleanup`

**Pesan Log yang Perlu Diperhatikan:**
- `[Cleanup Cron] Starting scheduled file cleanup job` - Job dimulai
- `[Cleanup Cron] Cleanup job completed successfully` - Job selesai
- `[Cleanup Cron] Summary: X/Y files deleted` - Ringkasan hasil
- `[Cleanup Cron] Unauthorized access attempt` - Kegagalan autentikasi
- `[Cleanup Cron] Error executing cleanup job` - Kegagalan job

### Vercel Cron Dashboard

Lihat status cron job:

1. Pergi ke dashboard project Anda
2. Klik tab "Cron Jobs"
3. Lihat riwayat eksekusi, tingkat sukses/gagal, dan log

### Alerts

Setup alert untuk kegagalan cron job:

1. Pergi ke "Settings" > "Notifications"
2. Aktifkan "Cron Job Failures" notifications
3. Tambahkan email atau Slack webhook untuk alert

## Troubleshooting

### Cron Job Tidak Berjalan

**Masalah:** Cron job tidak dieksekusi pada waktu yang dijadwalkan

**Solusi:**
1. Verifikasi `vercel.json` ada di root project
2. Pastikan project sudah di-deploy ke Vercel (cron job hanya bekerja di production)
3. Cek status cron job di Vercel dashboard
4. Verifikasi sintaks jadwal cron sudah benar

### Error 401 Unauthorized

**Masalah:** Cron job mengembalikan 401 Unauthorized

**Solusi:**
1. Verifikasi `CRON_SECRET` sudah diset di environment variables Vercel
2. Pastikan secret cocok antara Vercel dan endpoint Anda
3. Cek bahwa environment variable tersedia di environment Production
4. Deploy ulang setelah menambah/update environment variable

### Error 500 Server Error

**Masalah:** Cron job mengembalikan 500 Server Error

**Solusi:**
1. Cek Vercel logs untuk pesan error detail
2. Verifikasi kredensial Supabase dikonfigurasi dengan benar
3. Pastikan tabel database dan storage bucket ada
4. Cek error runtime di logika pembersihan

### File Tidak Terhapus

**Masalah:** Cron job berjalan sukses tapi file tidak terhapus

**Solusi:**
1. Cek ringkasan response untuk penghapusan yang gagal
2. Verifikasi file lebih lama dari 7 hari (periode retensi)
3. Cek permission Supabase Storage
4. Verifikasi `SUPABASE_SERVICE_ROLE_KEY` punya akses admin
5. Review error log untuk kegagalan penghapusan file spesifik

## Kustomisasi

### Ubah Jadwal

Untuk berjalan di waktu berbeda, update `schedule` di `vercel.json`:

**Contoh:**
- Setiap jam: `0 * * * *`
- Setiap 6 jam: `0 */6 * * *`
- Setiap hari tengah malam: `0 0 * * *`
- Setiap Minggu jam 3 pagi: `0 3 * * 0`
- Dua kali sehari (6 pagi dan 6 sore): `0 6,18 * * *`

Setelah mengubah, commit dan deploy ulang ke Vercel.

### Ubah Periode Retensi

Untuk mengubah berapa lama file disimpan sebelum dihapus:

1. Buka `src/lib/jobs/fileCleanup.ts`
2. Modifikasi konstanta `RETENTION_DAYS` (default: 7)
3. Commit dan deploy ulang

## Dokumentasi Terkait

- [Dokumentasi Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [README Cleanup Endpoint](./app/api/cron/cleanup/README.md)
- [Logika File Cleanup](./src/lib/jobs/fileCleanup.ts)
- [Panduan Setup Supabase](./SUPABASE_SETUP.md)

## Requirements

Konfigurasi ini mengimplementasikan **Requirement 10.1**: File_Cleanup_Job HARUS berjalan setiap 24 jam.

## Ringkasan

✅ **Konfigurasi Selesai:**
- `vercel.json` dibuat dengan jadwal cron
- Cron job berjalan setiap hari pada pukul 2:00 pagi UTC
- Memanggil endpoint `/api/cron/cleanup`
- Memerlukan environment variable `CRON_SECRET`

✅ **Langkah Selanjutnya:**
1. Generate `CRON_SECRET` yang aman
2. Tambahkan ke environment variables Vercel
3. Deploy ke Vercel
4. Monitor eksekusi di Vercel dashboard
5. Verifikasi file dibersihkan sesuai harapan
