# Deployment Guide

This document provides detailed deployment instructions for FluxConvert, including system requirements, platform-specific setup, and troubleshooting.

## Table of Contents

- [System Requirements](#system-requirements)
- [Vercel Limitations](#vercel-limitations)
- [Recommended Platforms](#recommended-platforms)
- [Platform-Specific Setup](#platform-specific-setup)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Required Software

1. **Node.js 20.x or higher**
   - Runtime for Next.js application
   - Download: https://nodejs.org/

2. **LibreOffice 7.0 or higher**
   - Required for Word-to-PDF conversion
   - Must support headless mode
   - Download: https://www.libreoffice.org/download/

3. **Python 3.8 or higher**
   - Required for PDF-to-Word conversion
   - Must be accessible in system PATH
   - Download: https://www.python.org/downloads/

4. **pdf2docx Python library**
   - Required for PDF-to-Word conversion
   - Install: `pip3 install pdf2docx`
   - PyPI: https://pypi.org/project/pdf2docx/

### Hardware Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 10GB minimum (for LibreOffice, temporary files, and application)
- **Network**: Stable internet connection for Supabase access

## Vercel Limitations

⚠️ **Important**: Vercel's serverless environment has significant limitations for this application.

### What Doesn't Work on Vercel

1. **LibreOffice Installation**
   - Vercel serverless functions do not support installing LibreOffice
   - Word-to-PDF conversion will fail with "LibreOffice not found" error

2. **System Package Dependencies**
   - Limited ability to install system-level packages
   - pdf2docx may fail due to missing dependencies

3. **Function Timeout**
   - Maximum 300 seconds on Pro plan
   - Free tier has lower limits
   - Large file conversions may timeout

### What Works on Vercel

- User authentication
- File upload and storage
- Conversion history
- UI components
- Database operations
- Cron jobs (file cleanup)

### Recommendation

**Do not deploy to Vercel for production use.** Use one of the recommended platforms below for full functionality.

## Recommended Platforms

### 1. AWS EC2 (Best for Production)

**Pros:**
- Full control over system packages
- No timeout limitations
- Highly scalable
- Reliable infrastructure
- Pay-as-you-go pricing

**Cons:**
- Requires more setup
- Need to manage server security
- More expensive than some alternatives

**Best For:** Production deployments, high-traffic applications

### 2. DigitalOcean (Best for Simplicity)

**Pros:**
- Simple setup process
- Affordable fixed pricing
- Good documentation
- Managed databases available
- App Platform or Droplets

**Cons:**
- Less scalable than AWS
- Fewer regions

**Best For:** Small to medium applications, startups

### 3. Railway (Best for Quick Deployment)

**Pros:**
- Deploy from GitHub in minutes
- Supports Dockerfile
- Generous free tier
- Automatic HTTPS
- Simple pricing

**Cons:**
- Smaller platform (less mature)
- Fewer features than AWS

**Best For:** Development, staging, small production apps

### 4. Docker on Any Platform (Best for Flexibility)

**Pros:**
- Consistent environment
- Deploy anywhere
- Pre-install all dependencies
- Easy to test locally

**Cons:**
- Requires Docker knowledge
- Need container hosting platform

**Best For:** Teams familiar with Docker, multi-cloud deployments

## Platform-Specific Setup

### AWS EC2 Setup

1. **Launch EC2 Instance**
   ```bash
   # Choose Ubuntu 22.04 LTS
   # Instance type: t3.medium or larger
   # Configure security group: Allow HTTP (80), HTTPS (443), SSH (22)
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt-get update
   sudo apt-get upgrade -y

   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install LibreOffice
   sudo apt-get install -y libreoffice

   # Install Python and pip
   sudo apt-get install -y python3 python3-pip

   # Install pdf2docx
   pip3 install pdf2docx

   # Verify installations
   node --version
   libreoffice --version
   python3 --version
   pip3 show pdf2docx
   ```

4. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd fluxconvert

   # Install dependencies
   npm install

   # Create .env.local file
   nano .env.local
   # Add your environment variables (see Environment Variables section)

   # Build application
   npm run build

   # Install PM2 for process management
   sudo npm install -g pm2

   # Start application
   pm2 start npm --name "fluxconvert" -- start

   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx (Optional but Recommended)**
   ```bash
   # Install Nginx
   sudo apt-get install -y nginx

   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/fluxconvert
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/fluxconvert /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### DigitalOcean Droplet Setup

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select plan (Basic $12/month or higher)
   - Add SSH key
   - Create droplet

2. **Follow AWS EC2 steps 2-6** (same process)

### DigitalOcean App Platform Setup

1. **Create New App**
   - Connect GitHub repository
   - Select branch

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Add Dockerfile** (see Docker Deployment section)

4. **Configure Environment Variables** (see Environment Variables section)

5. **Deploy**

### Railway Setup

1. **Create Railway Account**
   - Sign up at https://railway.app/

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add Dockerfile to Repository**
   ```dockerfile
   FROM node:20

   # Install LibreOffice and Python dependencies
   RUN apt-get update && apt-get install -y \
       libreoffice \
       python3 \
       python3-pip \
       && pip3 install pdf2docx \
       && rm -rf /var/lib/apt/lists/*

   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   EXPOSE 3000
   CMD ["npm", "start"]
   ```

4. **Configure Environment Variables**
   - Go to project settings
   - Add variables (see Environment Variables section)

5. **Deploy**
   - Railway will automatically build and deploy

## Docker Deployment

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    python3 \
    python3-pip \
    && pip3 install pdf2docx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application files
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - CRON_SECRET=${CRON_SECRET}
    volumes:
      - /tmp:/tmp
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t fluxconvert .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -e CRON_SECRET=your_secret \
  fluxconvert

# Or use docker-compose
docker-compose up -d
```

## Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Job Secret (for file cleanup)
CRON_SECRET=your-secure-random-secret
```

### Generate Secure CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Setting Environment Variables

**AWS EC2 / DigitalOcean Droplet:**
```bash
# Create .env.local file
nano .env.local
# Paste variables and save
```

**Docker:**
```bash
# Use -e flag or docker-compose.yml
docker run -e VARIABLE=value ...
```

**Railway / App Platform:**
- Use platform's environment variable UI
- Add each variable in settings

## Verification

### Test System Dependencies

```bash
# Test LibreOffice
libreoffice --headless --convert-to pdf --outdir /tmp /path/to/test.docx

# Test Python
python3 --version

# Test pdf2docx
python3 -c "from pdf2docx import Converter; print('pdf2docx installed')"
```

### Test Application

1. **Start Application**
   ```bash
   npm run build
   npm start
   ```

2. **Test Word-to-PDF Conversion**
   - Navigate to http://localhost:3000/word-to-pdf
   - Upload a .docx file
   - Verify conversion completes successfully
   - Download and verify PDF quality

3. **Test PDF-to-Word Conversion**
   - Navigate to http://localhost:3000/pdf-to-word
   - Upload a .pdf file
   - Verify conversion completes successfully
   - Download and verify DOCX quality

4. **Check Logs**
   ```bash
   # PM2 logs
   pm2 logs fluxconvert

   # Docker logs
   docker logs <container-id>
   ```

## Troubleshooting

### LibreOffice Not Found

**Error:** "LibreOffice not found" or "libreoffice: command not found"

**Solution:**
```bash
# Verify installation
which libreoffice

# If not found, install
sudo apt-get install -y libreoffice

# Verify again
libreoffice --version
```

### pdf2docx Import Error

**Error:** "ModuleNotFoundError: No module named 'pdf2docx'"

**Solution:**
```bash
# Install pdf2docx
pip3 install pdf2docx

# Verify installation
pip3 show pdf2docx

# If using virtual environment, activate it first
source venv/bin/activate
pip3 install pdf2docx
```

### Python Not Found

**Error:** "python3: command not found"

**Solution:**
```bash
# Install Python
sudo apt-get install -y python3 python3-pip

# Verify installation
python3 --version
```

### Conversion Timeout

**Error:** "Conversion timeout exceeded"

**Solution:**
1. Increase timeout in converter services (default: 120 seconds)
2. Check file size (max 50 MB)
3. Verify system resources (CPU, RAM)
4. Check for LibreOffice/Python process issues

### Temporary Files Not Cleaned Up

**Error:** Disk space filling up with temporary files

**Solution:**
```bash
# Manual cleanup
rm -rf /tmp/conversion-*

# Check cron job
# Verify CRON_SECRET is set correctly
# Check cron job logs in Vercel dashboard or application logs
```

### Port Already in Use

**Error:** "Port 3000 is already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Supabase Connection Error

**Error:** "Failed to connect to Supabase"

**Solution:**
1. Verify environment variables are set correctly
2. Check Supabase project is active
3. Verify API keys are valid
4. Check network connectivity

### Permission Denied Errors

**Error:** "EACCES: permission denied"

**Solution:**
```bash
# Fix file permissions
chmod -R 755 /path/to/app

# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER /path/to/app
```

## Support

For additional help:
- Check application logs
- Review Supabase logs
- Check system resource usage
- Verify all dependencies are installed
- Test conversions with small files first

## Security Considerations

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Secure Environment Variables**
   - Never commit .env files
   - Use secure secrets management
   - Rotate keys regularly

3. **Configure Firewall**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Regular Backups**
   - Backup Supabase database
   - Backup application files
   - Test restore procedures

5. **Monitor Logs**
   - Check for suspicious activity
   - Monitor conversion failures
   - Track resource usage
