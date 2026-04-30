# Vercel Cron Job Setup Guide

## Overview

This guide explains how to configure the Vercel Cron job for automated file cleanup in the FluxConvert application. The cron job runs daily at 2:00 AM UTC to delete files older than 7 days from Supabase Storage.

## Configuration Files

### vercel.json

The `vercel.json` file in the project root contains the cron job configuration:

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

**Configuration Details:**
- **path**: The API endpoint that will be called by the cron job (`/api/cron/cleanup`)
- **schedule**: Cron expression for daily execution at 2:00 AM UTC (`0 2 * * *`)

### Cron Schedule Format

The schedule uses standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Current Schedule:** `0 2 * * *`
- Minute: 0 (at the top of the hour)
- Hour: 2 (2:00 AM)
- Day of month: * (every day)
- Month: * (every month)
- Day of week: * (every day of the week)

**Result:** Runs daily at 2:00 AM UTC

## Environment Variable Setup

### Local Development

1. **Generate a secure random secret:**

   Using Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Using OpenSSL:
   ```bash
   openssl rand -hex 32
   ```

2. **Add to `.env.local`:**

   ```env
   CRON_SECRET=your_generated_secret_here
   ```

   **Important:** Never commit this file to version control. It's already in `.gitignore`.

### Vercel Production Setup

1. **Navigate to your Vercel project dashboard**
   - Go to https://vercel.com/dashboard
   - Select your FluxConvert project

2. **Open Environment Variables settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the sidebar

3. **Add the CRON_SECRET variable**
   - Click "Add New" button
   - **Key:** `CRON_SECRET`
   - **Value:** Your generated secure random secret (use the same commands as above to generate)
   - **Environment:** Select "Production" (and optionally "Preview" and "Development")
   - Click "Save"

4. **Redeploy your application**
   - After adding the environment variable, redeploy your application for the changes to take effect
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment

## How It Works

### Execution Flow

1. **Vercel Cron Trigger**
   - At 2:00 AM UTC daily, Vercel automatically sends a POST request to `/api/cron/cleanup`
   - Vercel includes the `CRON_SECRET` in the `Authorization` header as `Bearer <CRON_SECRET>`

2. **Authentication**
   - The endpoint verifies the `Authorization` header matches the configured `CRON_SECRET`
   - If invalid or missing, returns 401 Unauthorized
   - If not configured, returns 500 Server Error

3. **Cleanup Execution**
   - Calls `cleanupOldFiles()` from `src/lib/jobs/fileCleanup.ts`
   - Queries files older than 7 days with status 'active'
   - Processes files in batches of 100
   - For each file:
     - Deletes from Supabase Storage (both 'uploads' and 'converted' buckets)
     - Updates file status to 'deleted' in database
     - Logs any errors

4. **Response**
   - Returns summary with:
     - Total files processed
     - Successfully deleted count
     - Failed count
     - Error details for failed deletions

### Security

- **CRON_SECRET Protection:** Prevents unauthorized access to the cleanup endpoint
- **Bearer Token:** Uses standard Bearer token authentication
- **Environment-Specific:** Use different secrets for each environment
- **Never Commit:** Keep secrets out of version control

## Testing

### Local Testing

Test the endpoint locally using curl:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret_from_env_local"
```

**Expected Response (Success):**
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

### Production Testing

After deployment, you can manually trigger the cron job:

1. **Using Vercel CLI:**
   ```bash
   vercel env pull .env.production.local
   curl -X POST https://your-app.vercel.app/api/cron/cleanup \
     -H "Authorization: Bearer $(grep CRON_SECRET .env.production.local | cut -d '=' -f2)"
   ```

2. **Using Vercel Dashboard:**
   - Go to your project's "Cron Jobs" section
   - Find the cleanup job
   - Click "Run Now" to manually trigger execution

## Monitoring

### Vercel Logs

Monitor cron job execution in Vercel:

1. Go to your project dashboard
2. Click on "Logs" tab
3. Filter by function: `/api/cron/cleanup`

**Log Messages to Watch:**
- `[Cleanup Cron] Starting scheduled file cleanup job` - Job started
- `[Cleanup Cron] Cleanup job completed successfully` - Job finished
- `[Cleanup Cron] Summary: X/Y files deleted` - Results summary
- `[Cleanup Cron] Unauthorized access attempt` - Authentication failure
- `[Cleanup Cron] Error executing cleanup job` - Job failure

### Vercel Cron Dashboard

View cron job status:

1. Go to your project dashboard
2. Click on "Cron Jobs" tab
3. View execution history, success/failure rates, and logs

### Alerts

Set up alerts for cron job failures:

1. Go to "Settings" > "Notifications"
2. Enable "Cron Job Failures" notifications
3. Add email or Slack webhook for alerts

## Troubleshooting

### Cron Job Not Running

**Problem:** Cron job doesn't execute at scheduled time

**Solutions:**
1. Verify `vercel.json` is in the project root
2. Ensure the project is deployed to Vercel (cron jobs only work in production)
3. Check Vercel dashboard for cron job status
4. Verify the cron schedule syntax is correct

### 401 Unauthorized Error

**Problem:** Cron job returns 401 Unauthorized

**Solutions:**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Ensure the secret matches between Vercel and your endpoint
3. Check that the environment variable is available in the Production environment
4. Redeploy after adding/updating the environment variable

### 500 Server Error

**Problem:** Cron job returns 500 Server Error

**Solutions:**
1. Check Vercel logs for detailed error messages
2. Verify Supabase credentials are configured correctly
3. Ensure database tables and storage buckets exist
4. Check for any runtime errors in the cleanup logic

### Files Not Being Deleted

**Problem:** Cron job runs successfully but files aren't deleted

**Solutions:**
1. Check the response summary for failed deletions
2. Verify files are older than 7 days (retention period)
3. Check Supabase Storage permissions
4. Verify the `SUPABASE_SERVICE_ROLE_KEY` has admin access
5. Review error logs for specific file deletion failures

## Customization

### Change Schedule

To run at a different time, update the `schedule` in `vercel.json`:

**Examples:**
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Every day at midnight: `0 0 * * *`
- Every Sunday at 3 AM: `0 3 * * 0`
- Twice daily (6 AM and 6 PM): `0 6,18 * * *`

After changing, commit and redeploy to Vercel.

### Change Retention Period

To change how long files are kept before deletion:

1. Open `src/lib/jobs/fileCleanup.ts`
2. Modify the `RETENTION_DAYS` constant (default: 7)
3. Commit and redeploy

## Related Documentation

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cleanup Endpoint README](./app/api/cron/cleanup/README.md)
- [File Cleanup Logic](./src/lib/jobs/fileCleanup.ts)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)

## Requirements

This configuration implements **Requirement 10.1**: The File_Cleanup_Job SHALL run every 24 hours.

## Summary

✅ **Configuration Complete:**
- `vercel.json` created with cron schedule
- Cron job runs daily at 2:00 AM UTC
- Calls `/api/cron/cleanup` endpoint
- Requires `CRON_SECRET` environment variable

✅ **Next Steps:**
1. Generate a secure `CRON_SECRET`
2. Add to Vercel environment variables
3. Deploy to Vercel
4. Monitor execution in Vercel dashboard
5. Verify files are being cleaned up as expected
