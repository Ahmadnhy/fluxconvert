# Vercel Cron Job - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Generate CRON_SECRET

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (it will look like: `a1b2c3d4e5f6...`)

### 2. Add to Vercel Environment Variables

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your FluxConvert project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `CRON_SECRET`
   - **Value:** (paste the secret you generated)
   - **Environment:** Select **Production** (and optionally Preview/Development)
6. Click **Save**

### 3. Deploy

Push your code to GitHub or redeploy from Vercel dashboard:

```bash
git add .
git commit -m "Add Vercel Cron configuration"
git push
```

Vercel will automatically deploy.

### 4. Verify

1. Go to your Vercel project dashboard
2. Click **Cron Jobs** tab
3. You should see: `/api/cron/cleanup` scheduled for `0 2 * * *`
4. Click **Run Now** to test manually
5. Check **Logs** tab to verify successful execution

## ✅ What's Configured

- **Endpoint:** `/api/cron/cleanup`
- **Schedule:** Daily at 2:00 AM UTC
- **Action:** Deletes files older than 7 days from Supabase Storage
- **Security:** Requires `CRON_SECRET` in Authorization header

## 📊 Monitoring

### View Logs

1. Go to Vercel dashboard → **Logs**
2. Filter by function: `/api/cron/cleanup`
3. Look for:
   - ✅ `[Cleanup Cron] Starting scheduled file cleanup job`
   - ✅ `[Cleanup Cron] Cleanup job completed successfully`
   - ✅ `[Cleanup Cron] Summary: X/Y files deleted`

### Set Up Alerts

1. Go to **Settings** → **Notifications**
2. Enable **Cron Job Failures**
3. Add your email or Slack webhook

## 🧪 Test Locally

Add to your `.env.local`:

```env
CRON_SECRET=your_generated_secret_here
```

Test with curl:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer your_generated_secret_here"
```

Expected response:

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

### Cron job not showing in Vercel dashboard

- ✅ Verify `vercel.json` is in project root
- ✅ Redeploy the application
- ✅ Check Vercel dashboard after deployment completes

### Getting 401 Unauthorized

- ✅ Verify `CRON_SECRET` is set in Vercel environment variables
- ✅ Ensure you selected the correct environment (Production)
- ✅ Redeploy after adding the environment variable

### Files not being deleted

- ✅ Check if files are actually older than 7 days
- ✅ Verify Supabase credentials are correct
- ✅ Check Vercel logs for specific error messages
- ✅ Ensure `SUPABASE_SERVICE_ROLE_KEY` has admin permissions

## 📚 Full Documentation

For detailed information, see:
- [VERCEL_CRON_SETUP.md](./VERCEL_CRON_SETUP.md) - Complete setup guide
- [app/api/cron/cleanup/README.md](./app/api/cron/cleanup/README.md) - Endpoint documentation

## 🎯 Summary

✅ **Configuration file:** `vercel.json` created  
✅ **Schedule:** Daily at 2:00 AM UTC  
✅ **Security:** Protected by `CRON_SECRET`  
✅ **Action:** Deletes files older than 7 days  
✅ **Monitoring:** Available in Vercel dashboard  

**You're all set! The cron job will run automatically once deployed to Vercel.**
