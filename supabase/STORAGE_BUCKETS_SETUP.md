# Supabase Storage Buckets Setup Guide

This guide provides step-by-step instructions for creating and configuring the storage buckets required for the FluxConvert application's file storage functionality.

## Overview

The FluxConvert application requires two storage buckets in Supabase:

1. **uploads** - Stores user-uploaded input files (Word documents, images, etc.)
2. **converted** - Stores converted output files (PDFs, converted images, etc.)

Both buckets are configured as **private** to ensure secure file storage with access controlled through signed URLs.

---

## Prerequisites

Before starting, ensure you have:

- ✅ A Supabase project created for FluxConvert
- ✅ Access to the Supabase Dashboard
- ✅ Admin/Owner permissions on the Supabase project

---

## Step 1: Access Storage in Supabase Dashboard

1. Log in to your Supabase Dashboard at https://supabase.com/dashboard
2. Select your FluxConvert project
3. In the left sidebar, click on **Storage** (icon looks like a folder)
4. You should see the Storage interface with a list of existing buckets (if any)

---

## Step 2: Create the 'uploads' Bucket

### 2.1 Start Bucket Creation

1. Click the **"New bucket"** button (usually in the top-right corner)
2. A modal dialog will appear titled "Create a new bucket"

### 2.2 Configure Bucket Settings

Fill in the following settings:

| Setting | Value | Description |
|---------|-------|-------------|
| **Name** | `uploads` | Bucket identifier (must be lowercase, no spaces) |
| **Public bucket** | ❌ **OFF** (unchecked) | Keep files private - access via signed URLs only |
| **File size limit** | `52428800` bytes (50 MB) | Maximum file size: 50 MB |
| **Allowed MIME types** | See below | Restrict to specific file types |

### 2.3 Configure Allowed MIME Types

In the "Allowed MIME types" field, enter the following MIME types (one per line or comma-separated):

```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/msword
image/jpeg
image/png
application/pdf
```

**What these MIME types allow:**
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - .docx files (Word 2007+)
- `application/msword` - .doc files (older Word documents)
- `image/jpeg` - .jpg, .jpeg image files
- `image/png` - .png image files
- `application/pdf` - .pdf files

### 2.4 Create the Bucket

1. Review all settings to ensure they match the specifications above
2. Click **"Create bucket"** button
3. You should see a success message
4. The 'uploads' bucket should now appear in your buckets list

### 2.5 Verify Bucket Creation

To verify the bucket was created correctly:

1. Click on the **uploads** bucket in the list
2. Check the bucket details panel (usually on the right side):
   - ✅ Public: **OFF**
   - ✅ File size limit: **50 MB** (52428800 bytes)
   - ✅ Allowed MIME types: Shows the 5 types you configured

---

## Step 3: Create the 'converted' Bucket

### 3.1 Start Bucket Creation

1. Click the **"New bucket"** button again
2. A modal dialog will appear titled "Create a new bucket"

### 3.2 Configure Bucket Settings

Fill in the following settings:

| Setting | Value | Description |
|---------|-------|-------------|
| **Name** | `converted` | Bucket identifier (must be lowercase, no spaces) |
| **Public bucket** | ❌ **OFF** (unchecked) | Keep files private - access via signed URLs only |
| **File size limit** | `104857600` bytes (100 MB) | Maximum file size: 100 MB |
| **Allowed MIME types** | See below | Restrict to specific file types |

### 3.3 Configure Allowed MIME Types

In the "Allowed MIME types" field, enter the following MIME types:

```
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
```

**What these MIME types allow:**
- `application/pdf` - .pdf files (primary output format)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - .docx files
- `image/jpeg` - .jpg, .jpeg image files
- `image/png` - .png image files

### 3.4 Create the Bucket

1. Review all settings to ensure they match the specifications above
2. Click **"Create bucket"** button
3. You should see a success message
4. The 'converted' bucket should now appear in your buckets list

### 3.5 Verify Bucket Creation

To verify the bucket was created correctly:

1. Click on the **converted** bucket in the list
2. Check the bucket details panel:
   - ✅ Public: **OFF**
   - ✅ File size limit: **100 MB** (104857600 bytes)
   - ✅ Allowed MIME types: Shows the 4 types you configured

---

## Step 4: Verify Both Buckets

After creating both buckets, verify your Storage setup:

1. In the Storage interface, you should see **two buckets** listed:
   - ✅ **uploads** (Private, 50 MB limit)
   - ✅ **converted** (Private, 100 MB limit)

2. Both buckets should show:
   - 🔒 **Private** indicator (lock icon or "Private" label)
   - 📦 **0 objects** (empty, since no files uploaded yet)

---

## Step 5: Understanding Bucket Configuration

### Why Private Buckets?

Both buckets are configured as **private** for security reasons:

- **Access Control**: Only authenticated users can access their own files
- **Signed URLs**: Files are accessed via time-limited signed URLs (1-hour expiration)
- **Data Privacy**: Prevents unauthorized access to user files
- **Compliance**: Meets data protection requirements

### File Size Limits Explained

| Bucket | Limit | Reason |
|--------|-------|--------|
| **uploads** | 50 MB | Input files are typically smaller; prevents abuse |
| **converted** | 100 MB | Output files (especially PDFs) can be larger than inputs |

### MIME Type Restrictions

MIME type restrictions provide:

- **Security**: Prevents upload of executable files or malicious content
- **Validation**: Ensures only supported file types are stored
- **Storage Optimization**: Limits storage to relevant file types

---

## Step 6: Next Steps - Storage Policies

After creating the buckets, you need to configure **Storage Policies** to control access. This is covered in **Task 7.2**.

Storage policies will define:

- Who can upload files to each bucket
- Who can read/download files from each bucket
- Who can delete files from each bucket

**Important**: Without storage policies, even authenticated users cannot access the buckets. Task 7.2 must be completed before the application can use these buckets.

---

## Troubleshooting

### Issue: "Bucket name already exists"

**Solution**: 
- Bucket names must be unique within your Supabase project
- If you see this error, the bucket may already exist
- Check your buckets list to see if it's already created
- If it exists with wrong settings, delete it and recreate

### Issue: "Invalid MIME type format"

**Solution**:
- Ensure MIME types are entered correctly (no typos)
- Use the exact format: `type/subtype` (e.g., `application/pdf`)
- Separate multiple MIME types with commas or new lines
- No extra spaces before or after MIME types

### Issue: "Cannot set file size limit"

**Solution**:
- File size limit is in **bytes**, not MB
- 50 MB = 52,428,800 bytes
- 100 MB = 104,857,600 bytes
- Some Supabase UI versions may show MB directly - use the appropriate value

### Issue: "Bucket created but not visible"

**Solution**:
- Refresh the Storage page in your browser
- Check you're in the correct Supabase project
- Wait a few seconds - bucket creation may take a moment
- Check browser console for errors

### Issue: "Public bucket toggle not available"

**Solution**:
- Ensure you have admin/owner permissions on the project
- Some Supabase plans may have restrictions
- Default is private, which is what we want anyway

---

## Verification Checklist

Before proceeding to Task 7.2, verify:

- [ ] **uploads** bucket exists
- [ ] **uploads** bucket is **private** (not public)
- [ ] **uploads** bucket has **50 MB** file size limit
- [ ] **uploads** bucket has **5 allowed MIME types** configured
- [ ] **converted** bucket exists
- [ ] **converted** bucket is **private** (not public)
- [ ] **converted** bucket has **100 MB** file size limit
- [ ] **converted** bucket has **4 allowed MIME types** configured
- [ ] Both buckets appear in the Storage interface
- [ ] No errors or warnings displayed for either bucket

---

## Screenshots Reference

While this guide doesn't include actual screenshots, here's what you should see at each step:

### Storage Dashboard View
```
┌─────────────────────────────────────────────────┐
│ Storage                          [New bucket]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📦 uploads          Private    0 objects       │
│  📦 converted        Private    0 objects       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Bucket Creation Modal
```
┌─────────────────────────────────────────────────┐
│ Create a new bucket                      [X]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name: [uploads                        ]        │
│                                                 │
│  ☐ Public bucket                                │
│                                                 │
│  File size limit (bytes): [52428800    ]        │
│                                                 │
│  Allowed MIME types:                            │
│  [application/vnd.openxmlformats-...   ]        │
│  [application/msword                   ]        │
│  [image/jpeg                           ]        │
│  [image/png                            ]        │
│  [application/pdf                      ]        │
│                                                 │
│                    [Cancel] [Create bucket]     │
└─────────────────────────────────────────────────┘
```

---

## Additional Notes

### Bucket Naming Conventions

- Bucket names must be **lowercase**
- No spaces or special characters (except hyphens)
- Must be unique within your Supabase project
- Cannot be changed after creation (must delete and recreate)

### Storage Limits

- Supabase free tier includes **1 GB** of storage
- Pro tier includes **100 GB** of storage
- Monitor usage in **Settings** > **Usage**
- Set up alerts for storage usage in production

### File Organization

Files in buckets will be organized by user ID:

```
uploads/
  ├── {user-id-1}/
  │   ├── {timestamp}-document.docx
  │   └── {timestamp}-image.jpg
  └── {user-id-2}/
      └── {timestamp}-document.docx

converted/
  ├── {user-id-1}/
  │   ├── {timestamp}-document.pdf
  │   └── {timestamp}-image.pdf
  └── {user-id-2}/
      └── {timestamp}-document.pdf
```

This organization:
- Isolates user files for security
- Simplifies access control policies
- Makes cleanup and management easier

---

## Related Documentation

- **Task 7.2**: Configure storage policies (next step)
- **SUPABASE_SETUP.md**: Complete Supabase setup guide
- **supabase/schema.sql**: Database schema including files table
- **Design Document**: Storage architecture and data flow

---

## Summary

You have successfully created two storage buckets:

1. ✅ **uploads** - Private, 50 MB limit, 5 MIME types
2. ✅ **converted** - Private, 100 MB limit, 4 MIME types

**Next Step**: Proceed to **Task 7.2** to configure storage policies that control access to these buckets.

---

## Support

If you encounter issues not covered in this guide:

1. Check Supabase Storage documentation: https://supabase.com/docs/guides/storage
2. Review Supabase Dashboard help tooltips (hover over ? icons)
3. Check Supabase Discord community: https://discord.supabase.com
4. Verify your Supabase project plan includes Storage features

---

**Document Version**: 1.0  
**Last Updated**: Task 7.1 Implementation  
**Related Requirements**: 6.2, 6.3
