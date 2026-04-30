# Storage Buckets Quick Reference Card

**Task 7.1** - Quick reference for creating Supabase storage buckets

---

## Bucket 1: uploads

```
Name:              uploads
Public:            ❌ OFF (Private)
File Size Limit:   52428800 bytes (50 MB)
```

**Allowed MIME Types** (5 types):
```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/msword
image/jpeg
image/png
application/pdf
```

---

## Bucket 2: converted

```
Name:              converted
Public:            ❌ OFF (Private)
File Size Limit:   104857600 bytes (100 MB)
```

**Allowed MIME Types** (4 types):
```
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
```

---

## Quick Steps

1. **Supabase Dashboard** → **Storage** → **New bucket**
2. Enter bucket name (lowercase, no spaces)
3. **Uncheck** "Public bucket" (keep private)
4. Enter file size limit in **bytes**
5. Add MIME types (one per line or comma-separated)
6. Click **Create bucket**
7. Repeat for second bucket

---

## Verification Checklist

- [ ] Both buckets created
- [ ] Both buckets are **Private** (not public)
- [ ] **uploads**: 50 MB limit, 5 MIME types
- [ ] **converted**: 100 MB limit, 4 MIME types
- [ ] No errors or warnings

---

## File Size Conversions

| MB | Bytes |
|----|-------|
| 50 MB | 52,428,800 bytes |
| 100 MB | 104,857,600 bytes |

---

## Common Issues

**"Bucket name already exists"**
→ Check if bucket already created, delete and recreate if wrong settings

**"Invalid MIME type"**
→ Copy-paste from this reference card, check for typos

**"Cannot set file size limit"**
→ Use bytes (not MB), see conversion table above

---

**Full Guide**: See `supabase/STORAGE_BUCKETS_SETUP.md`  
**Requirements**: 6.2, 6.3  
**Next Task**: 7.2 (Configure storage policies)
