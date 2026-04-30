# File Cleanup Cron Endpoint

## Overview

This API endpoint triggers the automated file cleanup job that deletes files older than 7 days from Supabase Storage and marks them as deleted in the database.

## Endpoint

```
POST /api/cron/cleanup
```

## Authentication

The endpoint requires a `CRON_SECRET` to be passed in the `Authorization` header:

```
Authorization: Bearer <CRON_SECRET>
```

## Environment Variables

Add the following to your `.env.local` file:

```env
CRON_SECRET=your_secure_random_secret_here
```

**Important:** Use a strong, randomly generated secret. You can generate one using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Response Format

### Success Response (200)

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

### Error Responses

**401 Unauthorized** - Invalid or missing CRON_SECRET:
```json
{
  "error": "Unauthorized"
}
```

**500 Server Error** - CRON_SECRET not configured or cleanup job failed:
```json
{
  "error": "Server configuration error",
  "success": false
}
```

## Testing Locally

You can test the endpoint locally using curl:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Vercel Cron Configuration

This endpoint is designed to be called by Vercel Cron. See task 18.2 for configuration details.

The cron job should be configured in `vercel.json`:

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

This will run the cleanup job daily at 2:00 AM UTC.

## How It Works

1. Vercel Cron (or another scheduler) sends a POST request to `/api/cron/cleanup`
2. The endpoint verifies the `CRON_SECRET` from the Authorization header
3. If authorized, it calls `cleanupOldFiles()` from `src/lib/jobs/fileCleanup.ts`
4. The cleanup job:
   - Queries files older than 7 days with status 'active'
   - Processes files in batches of 100
   - Deletes each file from Supabase Storage
   - Updates the file status to 'deleted' in the database
   - Logs results and errors
5. Returns a summary of the cleanup operation

## Security Considerations

- **Never commit** the `CRON_SECRET` to version control
- Use a strong, randomly generated secret (at least 32 characters)
- The secret should be different for each environment (development, staging, production)
- Store the secret securely in Vercel's environment variables dashboard

## Monitoring

The endpoint logs all operations to the console:

- `[Cleanup Cron] Starting scheduled file cleanup job` - Job started
- `[Cleanup Cron] Cleanup job completed successfully` - Job finished
- `[Cleanup Cron] Summary: X/Y files deleted` - Summary of results
- `[Cleanup Cron] Unauthorized access attempt` - Failed authentication
- `[Cleanup Cron] Error executing cleanup job` - Job failed

Monitor these logs in Vercel's dashboard to ensure the cleanup job runs successfully.

## Related Files

- `src/lib/jobs/fileCleanup.ts` - Core cleanup logic
- `src/lib/storage/operations.ts` - Storage deletion operations
- `src/lib/database/files.ts` - Database file operations
- `.env.local.example` - Environment variable template

## Requirements

This endpoint implements **Requirement 10.1**: The File_Cleanup_Job SHALL run every 24 hours.
