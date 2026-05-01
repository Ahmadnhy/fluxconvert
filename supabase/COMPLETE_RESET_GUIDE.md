# 🔄 Panduan Lengkap: Reset & Setup Database Supabase dari Awal

## 📋 Ringkasan
Panduan ini akan membantu Anda:
1. Menghapus semua data dan struktur database yang ada
2. Membuat ulang database dengan schema yang benar (sudah termasuk fix anonymous uploads)
3. Mengkonfigurasi storage buckets dan policies
4. Memverifikasi semuanya berjalan dengan baik

---

## ⚠️ PERINGATAN
**Proses ini akan menghapus SEMUA data di database Anda!**
- Semua tabel akan dihapus
- Semua data user akan hilang
- Semua file conversion history akan hilang

Pastikan Anda sudah backup data penting sebelum melanjutkan.

---

## 🗑️ LANGKAH 1: Hapus Semua yang Ada

### 1.1 Buka Supabase SQL Editor
1. Buka: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
2. Anda akan melihat SQL Editor

### 1.2 Jalankan Script Cleanup
Copy dan paste SQL berikut, lalu klik **Run**:

```sql
-- ============================================
-- CLEANUP SCRIPT: Hapus semua tabel dan policies
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

DROP POLICY IF EXISTS "Users can view their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON public.conversions;

-- Drop all tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.conversions CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Verify cleanup
SELECT 'Cleanup completed successfully!' AS status;
```

**Expected Result:** Anda akan melihat pesan "Cleanup completed successfully!"

---

## 🏗️ LANGKAH 2: Buat Database Baru dengan Schema yang Benar

### 2.1 Jalankan Script Setup
Di SQL Editor yang sama, copy dan paste SQL berikut, lalu klik **Run**:

```sql
-- ============================================
-- SETUP SCRIPT: Buat database dengan schema lengkap
-- Includes FIX for anonymous user uploads
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FILES TABLE
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONVERSIONS TABLE
CREATE TABLE public.conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    input_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    output_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    
    conversion_type TEXT NOT NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX idx_files_status ON public.files(status);
CREATE INDEX idx_files_created_at_status ON public.files(created_at DESC, status);
CREATE INDEX idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX idx_conversions_status ON public.conversions(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Files policies (WITH ANONYMOUS USER FIX)
CREATE POLICY "Users can view their own files"
    ON public.files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

CREATE POLICY "Users can delete their own files"
    ON public.files FOR DELETE
    USING (auth.uid() = user_id);

-- Conversions policies (WITH ANONYMOUS USER FIX)
CREATE POLICY "Users can view their own conversions"
    ON public.conversions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

CREATE POLICY "Users can update their own conversions"
    ON public.conversions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Database setup completed successfully!' AS status;
SELECT 'Tables created: ' || count(*) AS tables_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'files', 'conversions');
```

**Expected Result:** 
- "Database setup completed successfully!"
- "Tables created: 3"

---

## 📦 LANGKAH 3: Setup Storage Buckets

### 3.1 Hapus Buckets Lama (jika ada)
1. Buka: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/storage/buckets
2. Untuk setiap bucket (`uploads`, `converted`, `temp`):
   - Klik icon **⋮** (three dots) di sebelah kanan bucket
   - Pilih **Delete bucket**
   - Konfirmasi penghapusan

### 3.2 Buat Buckets Baru

#### Bucket 1: uploads
1. Klik **New bucket**
2. Name: `uploads`
3. Public bucket: **OFF** (unchecked)
4. Klik **Create bucket**

#### Bucket 2: converted
1. Klik **New bucket**
2. Name: `converted`
3. Public bucket: **OFF** (unchecked)
4. Klik **Create bucket**

#### Bucket 3: temp (optional)
1. Klik **New bucket**
2. Name: `temp`
3. Public bucket: **OFF** (unchecked)
4. Klik **Create bucket**

---

## 🔐 LANGKAH 4: Konfigurasi Storage Policies

### 4.1 Policies untuk Bucket "uploads"

1. Buka: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/storage/buckets/uploads
2. Klik tab **Policies**
3. Klik **New policy**

#### Policy 1: Allow anonymous and authenticated uploads
- **Policy name**: `Allow anonymous and authenticated uploads`
- **Allowed operation**: **INSERT**
- **Policy definition**:
```sql
(bucket_id = 'uploads') AND (
  (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
  OR
  (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
)
```
- Klik **Review** → **Save policy**

#### Policy 2: Allow users to read their own files
- Klik **New policy** lagi
- **Policy name**: `Allow users to read their own files`
- **Allowed operation**: **SELECT**
- **Policy definition**:
```sql
(bucket_id = 'uploads') AND (
  (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
  OR
  (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
)
```
- Klik **Review** → **Save policy**

#### Policy 3: Allow users to delete their own files
- Klik **New policy** lagi
- **Policy name**: `Allow users to delete their own files`
- **Allowed operation**: **DELETE**
- **Policy definition**:
```sql
(bucket_id = 'uploads') AND (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
```
- Klik **Review** → **Save policy**

### 4.2 Policies untuk Bucket "converted"

1. Buka: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/storage/buckets/converted
2. Klik tab **Policies**
3. Klik **New policy**

#### Policy 1: Allow anonymous and authenticated uploads
- **Policy name**: `Allow anonymous and authenticated uploads`
- **Allowed operation**: **INSERT**
- **Policy definition**:
```sql
(bucket_id = 'converted') AND (
  (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
  OR
  (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
)
```
- Klik **Review** → **Save policy**

#### Policy 2: Allow users to read their own files
- Klik **New policy** lagi
- **Policy name**: `Allow users to read their own files`
- **Allowed operation**: **SELECT**
- **Policy definition**:
```sql
(bucket_id = 'converted') AND (
  (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
  OR
  (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
)
```
- Klik **Review** → **Save policy**

#### Policy 3: Allow users to delete their own files
- Klik **New policy** lagi
- **Policy name**: `Allow users to delete their own files`
- **Allowed operation**: **DELETE**
- **Policy definition**:
```sql
(bucket_id = 'converted') AND (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = auth.uid())
```
- Klik **Review** → **Save policy**

---

## ✅ LANGKAH 5: Verifikasi Setup

### 5.1 Jalankan Tests
Kembali ke terminal Anda dan jalankan:

```bash
# Test bug condition exploration (harus PASS sekarang)
npm test src/lib/database/files.test.ts

# Test preservation properties (harus PASS)
npm test src/lib/database/preservation.properties.test.ts
```

**Expected Result:**
- ✅ Semua test di `files.test.ts` harus **PASS**
- ✅ Semua test di `preservation.properties.test.ts` harus **PASS**

### 5.2 Test Manual - Anonymous User Flow

1. Buka browser: http://localhost:3000/word-to-pdf
2. **JANGAN login** (test sebagai anonymous user)
3. Upload file .docx
4. Klik "Convert to PDF"
5. Verify: Conversion berhasil dan Anda bisa download PDF

**Expected Result:** ✅ Conversion berhasil tanpa error

### 5.3 Test Manual - Authenticated User Flow

1. Buka: http://localhost:3000/register
2. Daftar akun baru
3. Login dengan akun tersebut
4. Buka: http://localhost:3000/word-to-pdf
5. Upload file .docx
6. Klik "Convert to PDF"
7. Buka: http://localhost:3000/dashboard
8. Verify: File conversion muncul di dashboard

**Expected Result:** ✅ Semua berjalan lancar, file muncul di dashboard

---

## 🎉 SELESAI!

Jika semua langkah di atas berhasil, database Anda sekarang:
- ✅ Bersih dan terstruktur dengan baik
- ✅ Sudah include fix untuk anonymous user uploads
- ✅ Storage policies sudah dikonfigurasi dengan benar
- ✅ Semua tests passing
- ✅ Fitur berjalan dengan baik untuk anonymous dan authenticated users

---

## 🆘 Troubleshooting

### Problem: Test masih gagal setelah setup
**Solution:** 
- Pastikan Anda sudah jalankan SEMUA SQL scripts di atas
- Cek di Supabase Dashboard → Database → Tables, pastikan ada 3 tables: profiles, files, conversions
- Cek policies di Database → Policies, pastikan semua policies sudah dibuat

### Problem: Storage upload gagal
**Solution:**
- Cek storage policies di Storage → Buckets → [bucket name] → Policies
- Pastikan policy definition PERSIS seperti di panduan (termasuk spasi dan tanda kurung)
- Pastikan bucket sudah dibuat dengan nama yang benar: `uploads`, `converted`

### Problem: Authenticated user tidak bisa upload
**Solution:**
- Cek apakah user sudah login dengan benar
- Cek di browser console untuk error messages
- Verify token di localStorage: `localStorage.getItem('supabase.auth.token')`

---

## 📝 Catatan Penting

1. **Anonymous uploads** sekarang berfungsi karena RLS policy mengizinkan `user_id = NULL`
2. **Storage paths** untuk anonymous: `anonymous/{timestamp}-{filename}`
3. **Storage paths** untuk authenticated: `{user_id}/{timestamp}-{filename}`
4. **File cleanup** akan dihandle oleh cron job untuk kedua jenis user
5. **Security** tetap terjaga: anonymous user tidak bisa lihat/edit/hapus file apapun

