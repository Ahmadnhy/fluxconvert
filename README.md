# 📄 FluxConvert - File Converter Web Application

Website converter file berbasis web yang memungkinkan pengguna untuk mengubah berbagai format file seperti Word ke PDF, JPG ke PDF, PDF ke JPG, serta menggabungkan dan memisahkan file PDF dengan mudah dan cepat.

Live Demo: [fluxyconvert.vercel.app](https://fluxyconvert.vercel.app)

---

# 🌟 Fitur Utama (Key Features)

- 📂 **Konverter File Komplit**:
  - **Word ke PDF** (.docx → .pdf)
  - **PDF ke Word** (.pdf → .docx)
  - **JPG ke PDF** (.jpg/.jpeg/.png → .pdf) dengan pengaturan margin, ukuran A4/fit, dan rotasi.
  - **PDF ke JPG** (.pdf → .jpg) per halaman.
  - **Merge PDF** — Gabungkan beberapa PDF menjadi satu dokumen.
  - **Split PDF** — Ekstrak halaman atau pisahkan berkas PDF berdasarkan halaman tertentu.
- 📱 **Desain Mobile-First & Premium**:
  - Tampilan modern, rapi, dan responsif 100% di semua device handphone/tablet tanpa ada overflow.
  - Hambuger menu laci samping (`MobileNav`) dengan transisi _spring animation_ yang super mulus.
  - Desain _glassmorphism_ modern dengan efek `backdrop-blur` pada navigasi bar atas.
  - Mikro-animasi interaktif seperti tombol melayang (`.btn-lift`) dan bar progres dengan shimmer effect (`.progress-bar-shimmer`) yang sangat ringan (diakselerasi GPU).
- 🔍 **SEO & Searchability Optimal**:
  - Meta tags, deskripsi, dan keywords yang teroptimasi di mesin pencari Google (termasuk kata kunci `flux convert` dan `flucvonvert`).
  - Integrasi kode verifikasi kepemilikan Google (`google-site-verification`).
  - Peta situs dinamis (`sitemap.xml`) dan panduan bot perayap (`robots.txt`) bawaan Next.js.
- 🎨 **Branding Kustom Bersih**:
  - Ikon website kustom (`app/icon.png`) yang terintegrasi secara _native_ pada browser lama, shortcuts seluler, dan Apple devices, dengan pembersihan favicon bawaan lama.
- 🔐 **Autentikasi & Database Aman**:
  - Sistem login/register aman dengan Supabase Auth dan PostgreSQL.
  - Keamanan penyimpanan file (_Row Level Security_) di Supabase Storage.

---

## 🚀 Cara Memulai (Get Started)

### Langkah Instalasi

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd fluxconvert
   ```

2. **Install dependensi Node.js**

   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Salin berkas template `.env.local.example` menjadi `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

   Isi credentials Supabase Anda:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   CRON_SECRET=your_secure_random_secret_here
   ```

4. **Jalankan Server Development**

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000` pada browser Anda.

5. **Build Produksi (Verification)**
   ```bash
   npm run build
   ```

---

## 🧰 Tech Stack

### 🌐 Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - Drag & drop file upload
- **Framer Motion** - Animation library

### ⚙️ Backend

- **Next.js API Routes** - Serverless API endpoints
- **pdf-lib** - PDF manipulation
- **sharp** - Image processing
- **mammoth.js** - Word document processing

### 🗄️ Database & Storage

- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Row Level Security

---

## 📁 Project Structure

```
fluxconvert/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── convert/
│   │       ├── word-to-pdf/      # Word to PDF conversion endpoint
│   │       ├── jpg-to-pdf/       # JPG/PNG to PDF conversion endpoint
│   │       ├── pdf-to-jpg/       # PDF to JPG conversion endpoint
│   │       ├── merge-pdf/        # Merge PDF endpoint
│   │       └── split-pdf/        # Split PDF endpoint
│   ├── auth/                     # Auth callbacks
│   ├── dashboard/                # User dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── word-to-pdf/              # Word to PDF converter page
│   ├── jpg-to-pdf/               # JPG to PDF converter page
│   ├── pdf-to-jpg/               # PDF to JPG converter page
│   ├── merge-pdf/                # Merge PDF page
│   ├── split-pdf/                # Split PDF page
│   ├── result/                   # Result page
│   └── page.tsx                  # Home page
│
├── src/
│   ├── components/
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── converters/           # Converter components
│   │   │   ├── WordToPdfConverter.tsx
│   │   │   ├── JpgToPdfConverter.tsx
│   │   │   ├── PdfToJpgConverter.tsx
│   │   │   ├── MergePdfConverter.tsx
│   │   │   └── SplitPdfConverter.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   │   └── ConversionHistory.tsx
│   │   ├── home.tsx              # Home page component
│   │   └── result.tsx            # Result page component
│   │
│   └── lib/
│       ├── converters/           # Conversion logic
│       │   ├── wordToPdf.ts
│       │   ├── jpgToPdf.ts
│       │   ├── pdfToJpg.ts
│       │   ├── mergePdf.ts
│       │   └── splitPdf.ts
│       └── supabase/             # Supabase client utilities
│           ├── client.ts         # Browser client
│           ├── server.ts         # Server client
│           └── middleware.ts     # Auth middleware
│
├── supabase/
│   └── schema.sql                # Database schema
│
├── public/
│   └── images/                   # Static images and references
│
├── middleware.ts                 # Next.js middleware
├── .env.local.example            # Environment variables template
├── SUPABASE_SETUP.md            # Supabase setup guide
└── README.md                     # This file
```

---

## 🗄️ Database Schema

### Tables

1. **profiles** - Extended user information
2. **files** - File metadata and storage paths
3. **conversions** - Conversion history and status

### Storage Buckets

1. **uploads** - Original uploaded files
2. **converted** - Converted output files
3. **temp** - Temporary processing files

See [supabase/schema.sql](./supabase/schema.sql) for complete schema.

---

## 📦 API Endpoints

### Conversion Endpoints

#### Word to PDF

```
POST /api/convert/word-to-pdf
Content-Type: multipart/form-data

Body:
- file: File (required, .docx, max 50MB)

Response:
{
  "success": true,
  "fileName": "document.pdf",
  "fileSize": "2.4 MB",
  "downloadUrl": "data:application/pdf;base64,..."
}
```

#### JPG/PNG to PDF

```
POST /api/convert/jpg-to-pdf
Content-Type: multipart/form-data

Body:
- files: File[] (required, .jpg/.jpeg/.png, max 50MB each, max 20 files)

Response:
{
  "success": true,
  "fileName": "merged_images_1234567890.pdf",
  "fileSize": "5.1 MB",
  "downloadUrl": "data:application/pdf;base64,...",
  "pageCount": 3
}
```

#### PDF to JPG

```
POST /api/convert/pdf-to-jpg
Content-Type: multipart/form-data

Body:
- file: File (required, .pdf, max 50MB)

Response:
{
  "success": true,
  "fileName": "document.jpg" or "document_images.zip",
  "fileSize": "3.2 MB",
  "downloadUrl": "data:image/jpeg;base64,..." or "data:application/zip;base64,...",
  "totalPages": 5
}
```

#### Merge PDF

```
POST /api/convert/merge-pdf
Content-Type: multipart/form-data

Body:
- files: File[] (required, .pdf, min 2 files, max 20 files, max 50MB each)

Response:
{
  "success": true,
  "fileName": "merged_1234567890.pdf",
  "fileSize": "8.7 MB",
  "downloadUrl": "data:application/pdf;base64,...",
  "totalPages": 15
}
```

#### Split PDF

```
POST /api/convert/split-pdf
Content-Type: multipart/form-data

Body:
- file: File (required, .pdf, max 50MB)
- pageRanges: string (required, e.g. "1-3, 5, 7-10")

Response:
{
  "success": true,
  "fileName": "document_pages_1-3,5.pdf",
  "fileSize": "1.5 MB",
  "downloadUrl": "data:application/pdf;base64,...",
  "extractedPages": 4,
  "totalPages": 10
}
```

---

## 🔐 Authentication Flow

1. **Registration**
   - User fills registration form
   - Password validation (min 8 chars, letters + numbers)
   - Supabase creates user account
   - Verification email sent
   - Profile automatically created via trigger

2. **Login**
   - User enters email and password
   - Supabase validates credentials
   - Session created with secure cookies
   - Redirect to dashboard

3. **Session Management**
   - Middleware refreshes session on each request
   - Automatic logout on session expiry
   - Secure cookie-based authentication

---

## 🛡️ Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Secure file storage with private buckets
- ✅ Password strength validation
- ✅ Email verification
- ✅ Secure session management
- ✅ File type and size validation
- ✅ Sanitized file names

---

## 🐛 Known Issues

1. Word to PDF conversion uses basic text extraction (no complex formatting yet)
2. Large files (>10MB) may take longer to process
3. Email verification required for production (can be disabled for development)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Ahmad Nur Hidayat**  
App & Web Developer | [ahmadnh.is-a.dev](https://ahmadnh.is-a.dev)
