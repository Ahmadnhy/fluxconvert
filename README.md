# 📄 FluxConvert - File Converter Web Application

Website converter file berbasis web yang memungkinkan pengguna untuk mengubah berbagai format file seperti Word ke PDF, JPG ke PDF, PDF ke JPG, serta menggabungkan dan memisahkan file PDF dengan mudah dan cepat.

Project ini dibuat menggunakan **Next.js 16 sebagai frontend dan backend**, serta **Supabase sebagai database dan storage**.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fluxconvert
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_secure_random_secret_here
```

Generate a secure `CRON_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Set up Supabase**

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**

Navigate to `http://localhost:3000`

---

## 🚀 Features

### ✅ Implemented Features

#### 📂 Core Conversion Features

* ✅ **Word (.docx) → PDF** - Convert Word documents to PDF format
* 🔄 JPG / PNG → PDF (Coming soon)
* 🔄 PDF → JPG (Coming soon)
* 🔄 Merge PDF (Coming soon)
* 🔄 Split PDF (Coming soon)

#### 📤 File Upload Features

* ✅ Drag & Drop upload file
* ✅ File preview before convert
* ✅ File size validation (50 MB limit)
* ✅ Supported file validation
* ✅ Error handling and notifications

#### ⚙️ Conversion Features

* ✅ Real-time progress bar
* ✅ Status messages (Uploading, Converting, Completed)
* ✅ Download converted files
* ✅ Error notifications

#### 👤 User Features

* ✅ **User Registration** - Create account with email verification
* ✅ **User Login** - Secure authentication with Supabase
* ✅ **User Logout** - Session management
* ✅ **Conversion History** - View all past conversions
* ✅ **Dashboard** - User dashboard with quick actions

#### 🗄️ Database & Storage

* ✅ **Supabase Integration** - PostgreSQL database
* ✅ **Supabase Storage** - File storage with 3 buckets
* ✅ **Row Level Security** - Secure data access
* ✅ **User Profiles** - Extended user data
* ✅ **Automated File Cleanup** - Daily cleanup of files older than 7 days

#### 🌙 UI / UX Features

* ✅ Responsive design (Mobile, Tablet, Desktop)
* ✅ Modern Minimalist Clean UI
* ✅ Loading animations with Framer Motion
* ✅ Progress indicators
* ✅ Hover effects and transitions

---

## 🧰 Tech Stack

### 🌐 Frontend

* **Next.js 16** - React framework with App Router
* **React 19** - UI library
* **Tailwind CSS** - Utility-first CSS framework
* **React Dropzone** - Drag & drop file upload
* **Framer Motion** - Animation library

### ⚙️ Backend

* **Next.js API Routes** - Serverless API endpoints
* **pdf-lib** - PDF manipulation
* **sharp** - Image processing
* **mammoth.js** - Word document processing

### 🗄️ Database & Storage

* **Supabase** - Backend as a Service
  * PostgreSQL database
  * Authentication
  * Storage
  * Row Level Security

---

## 📁 Project Structure

```
fluxconvert/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── convert/
│   │       └── word-to-pdf/      # Word to PDF conversion endpoint
│   ├── auth/                     # Auth callbacks
│   ├── dashboard/                # User dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── word-to-pdf/              # Word to PDF converter page
│   ├── result/                   # Result page
│   └── page.tsx                  # Home page
│
├── src/
│   ├── components/
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── converters/           # Converter components
│   │   │   └── WordToPdfConverter.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   │   └── ConversionHistory.tsx
│   │   ├── home.tsx              # Home page component
│   │   └── result.tsx            # Result page component
│   │
│   └── lib/
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

* ✅ Row Level Security (RLS) on all tables
* ✅ Secure file storage with private buckets
* ✅ Password strength validation
* ✅ Email verification
* ✅ Secure session management
* ✅ File type and size validation
* ✅ Sanitized file names
* 🔄 CSRF protection (Coming soon)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables (including `CRON_SECRET`)
4. Deploy

**Note:** The automated file cleanup cron job will only work in production on Vercel. See [VERCEL_CRON_SETUP.md](./VERCEL_CRON_SETUP.md) for detailed setup instructions.

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your_secure_random_secret_here
```

**Important:** Generate a strong `CRON_SECRET` for production. See [VERCEL_CRON_SETUP.md](./VERCEL_CRON_SETUP.md) for details.

---

## 🧪 Testing

```bash
# Run build
npm run build

# Run in production mode
npm start
```

---

## 📝 Development Roadmap

### Phase 1: Core Features ✅
- [x] Word to PDF conversion
- [x] User authentication
- [x] Conversion history
- [x] Supabase integration

### Phase 2: Additional Converters 🔄
- [ ] PDF to Word
- [ ] JPG/PNG to PDF
- [ ] PDF to JPG
- [ ] Merge PDF
- [ ] Split PDF

### Phase 3: Optimization ✅
- [x] Automated file cleanup
- [ ] Performance optimization
- [ ] Better error handling
- [ ] Analytics

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

**Depni**  
App & Web Developer