# Vercel Cron Job - Panduan Cepat

## 🚀 Setup Cepat (5 Menit)

### 1. Generate CRON_SECRET

Jalankan perintah ini untuk generate secret yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy outputnya (akan terlihat seperti: `a1b2c3d4e5f6...`)

### 2. Tambahkan ke Vercel Environment Variables

1. Pergi ke dashboard project Vercel Anda: https://vercel.com/dashboard
2. Pilih project FluxConvert Anda
3. Klik **Settings** → **Environment Variables**
4. Klik **Add New**
5. Masukkan:
   - **Key:** `CRON_SECRET`
   - **Value:** (paste secret yang Anda generate)
   - **Environment:** Pilih **Production** (dan opsional Preview/Development)
6. Klik **Save**

### 3. Deploy

Push code Anda ke GitHub atau deploy ulang dari Vercel dashboard:

```bash
git add .
git commit -m "Add Vercel Cron configuration"
git push
```

Vercel akan otomatis deploy.

### 4. Verifikasi

1. Pergi ke dashboard project Vercel Anda
2. Klik tab **Cron Jobs**
3. Anda harus melihat: `/api/cron/cleanup` dijadwalkan untuk `0 2 * * *`
4. Klik **Run Now** untuk test manual
5. Cek tab **Logs** untuk verifikasi eksekusi berhasil

## ✅ Yang Sudah Dikonfigurasi

- **Endpoint:** `/api/cron/cleanup`
- **Jadwal:** Setiap hari pukul 2:00 pagi UTC
- **Aksi:** Menghapus file lebih lama dari 7 hari dari Supabase Storage
- **Keamanan:** Memerlukan `CRON_SECRET` di header Authorization

## 📊 Monitoring

### Lihat Logs

1. Pergi ke Vercel dashboard → **Logs**
2. Filter berdasarkan function: `/api/cron/cleanup`
3. Cari:
   - ✅ `[Cleanup Cron] Starting scheduled file cleanup job`
   - ✅ `[Cleanup Cron] Cleanup job completed successfully`
   - ✅ `[Cleanup Cron] Summary: X/Y files deleted`

### Setup Alerts

1. Pergi ke **Settings** → **Notifications**
2. Aktifkan **Cron Job Failures**
3. Tambahkan email atau Slack webhook Anda

## 🧪 Test Lokal

Tambahkan ke `.env.local` Anda:

```env
CRON_SECRET=secret_yang_anda_generate_disini
```

Test dengan curl:

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

## 🔧 Troubleshooting

### Cron job tidak muncul di Vercel dashboard

- ✅ Verifikasi `vercel.json` ada di root project
- ✅ Deploy ulang aplikasi
- ✅ Cek Vercel dashboard setelah deployment selesai

### Mendapat 401 Unauthorized

- ✅ Verifikasi `CRON_SECRET` sudah diset di environment variables Vercel
- ✅ Pastikan Anda memilih environment yang benar (Production)
- ✅ Deploy ulang setelah menambahkan environment variable

### File tidak terhapus

- ✅ Cek apakah file benar-benar lebih lama dari 7 hari
- ✅ Verifikasi kredensial Supabase sudah benar
- ✅ Cek Vercel logs untuk pesan error spesifik
- ✅ Pastikan `SUPABASE_SERVICE_ROLE_KEY` punya permission admin

## 📚 Dokumentasi Lengkap

Untuk informasi detail, lihat:
- [VERCEL_CRON_SETUP_ID.md](./VERCEL_CRON_SETUP_ID.md) - Panduan setup lengkap
- [app/api/cron/cleanup/README.md](./app/api/cron/cleanup/README.md) - Dokumentasi endpoint

## 🎯 Ringkasan

✅ **File konfigurasi:** `vercel.json` sudah dibuat  
✅ **Jadwal:** Setiap hari pukul 2:00 pagi UTC  
✅ **Keamanan:** Dilindungi oleh `CRON_SECRET`  
✅ **Aksi:** Menghapus file lebih lama dari 7 hari  
✅ **Monitoring:** Tersedia di Vercel dashboard  

**Anda siap! Cron job akan berjalan otomatis setelah di-deploy ke Vercel.**
