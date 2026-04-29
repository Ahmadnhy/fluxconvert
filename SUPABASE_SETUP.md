# Supabase Setup Guide for FluxConvert

This guide will help you set up Supabase for the FluxConvert application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in the project details:
   - **Name**: FluxConvert
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
```

2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration
6. You should see success messages for all tables and functions

## Step 5: Create Storage Buckets

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Create three buckets with these settings:

### Bucket 1: uploads
- **Name**: `uploads`
- **Public**: OFF (private)
- **File size limit**: 50 MB
- **Allowed MIME types**: Leave empty (all types)

### Bucket 2: converted
- **Name**: `converted`
- **Public**: OFF (private)
- **File size limit**: 100 MB
- **Allowed MIME types**: Leave empty (all types)

### Bucket 3: temp
- **Name**: `temp`
- **Public**: OFF (private)
- **File size limit**: 100 MB
- **Allowed MIME types**: Leave empty (all types)

## Step 6: Configure Storage Policies

For each bucket, set up the following policies:

### For `uploads` bucket:

1. Go to **Storage** > **Policies** > **uploads**
2. Click "New Policy"
3. Create these policies:

**Policy 1: Users can upload their own files**
```sql
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Users can read their own files**
```sql
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Users can delete their own files**
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### For `converted` bucket:

Repeat the same policies as `uploads`, but change `bucket_id = 'uploads'` to `bucket_id = 'converted'`

### For `temp` bucket:

Repeat the same policies as `uploads`, but change `bucket_id = 'uploads'` to `bucket_id = 'temp'`

## Step 7: Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## Step 8: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Go to `http://localhost:3000/register`
3. Create a test account
4. Check your email for verification
5. Login at `http://localhost:3000/login`
6. You should be redirected to the dashboard

## Step 9: Verify Database Tables

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `profiles`
   - `files`
   - `conversions`

## Troubleshooting

### Issue: "Invalid API key"
- Double-check your `.env.local` file
- Make sure you copied the correct keys from Supabase dashboard
- Restart your development server after changing `.env.local`

### Issue: "Row Level Security policy violation"
- Make sure you ran all the SQL from `schema.sql`
- Check that RLS policies are enabled for all tables
- Verify storage policies are set up correctly

### Issue: "Email not sending"
- Check your Supabase project's email settings
- For development, you can disable email confirmation in **Authentication** > **Settings**
- Set "Enable email confirmations" to OFF for testing

### Issue: "Storage upload failed"
- Verify all three buckets are created
- Check storage policies are set up correctly
- Make sure file size is under the limit

## Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_APP_URL` in your environment variables
2. Enable email confirmations in Supabase
3. Set up custom SMTP for email sending (optional)
4. Configure rate limiting in Supabase dashboard
5. Set up database backups
6. Monitor usage in Supabase dashboard

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Keep service_role key secret** - only use it in server-side code
3. **Enable RLS** on all tables
4. **Use signed URLs** for file downloads
5. **Implement rate limiting** for API endpoints
6. **Regularly rotate** API keys
7. **Monitor** authentication logs for suspicious activity

## Next Steps

After setup is complete:

1. Test user registration and login
2. Test file upload and conversion
3. Verify conversion history is working
4. Test file download from storage
5. Set up automated file cleanup (cron job)

## Support

If you encounter issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Check Supabase Discord: https://discord.supabase.com
3. Review the logs in Supabase dashboard

## Database Schema Reference

See `supabase/schema.sql` for the complete database schema including:
- Table definitions
- Indexes
- RLS policies
- Functions and triggers
- Comments and documentation
