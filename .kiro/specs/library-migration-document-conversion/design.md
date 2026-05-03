# Design Document: Library Migration and UI Improvements

## Overview

This design document specifies the technical approach for migrating the document conversion feature from basic text-extraction libraries (mammoth.js + pdf-lib for Word-to-PDF, pdf2json + docx for PDF-to-Word) to high-fidelity conversion tools (LibreOffice CLI for Word-to-PDF, pdf2docx for PDF-to-Word). The migration preserves formatting, images, tables, and other document elements while maintaining backward compatibility with existing API contracts.

Additionally, this design addresses UI improvements including:
- Fixing pending status display in conversion history
- Adding delete functionality for conversion history entries
- Improving placeholder visibility in search and filter inputs
- Removing horizontal scrollbar through responsive design fixes

### Key Design Goals

1. **High-Fidelity Conversion**: Preserve document formatting, images, tables, headers, footers, and page layout
2. **Backward Compatibility**: Maintain existing API endpoints and response structures
3. **Robust Error Handling**: Gracefully handle conversion failures with descriptive error messages
4. **Temporary File Management**: Ensure proper cleanup of temporary files to prevent disk space exhaustion
5. **Dual User Support**: Support both authenticated and anonymous users with appropriate storage strategies
6. **UI Consistency**: Fix status display bugs and improve user experience with better visual feedback
7. **Responsive Design**: Eliminate horizontal scrolling across all viewport sizes

### Research Summary

**LibreOffice CLI Conversion**:
LibreOffice provides a headless command-line interface for document conversion. The basic syntax is:
```bash
libreoffice --headless --convert-to pdf --outdir /output/path /input/file.docx
```

Key findings ([systutorials.com](https://www.systutorials.com/how-to-convert-a-docx-doc-ms-word-file-to-pdf-in-command-line-on-linux/), [libreoffice.org](https://help.libreoffice.org/latest/he/text/shared/guide/pdf_params.html)):
- Headless mode operates without GUI dependencies
- Supports output directory specification
- Preserves formatting, images, tables, and page layout
- Requires LibreOffice installation on the host system

**pdf2docx Library**:
pdf2docx is a Python library that converts PDF files to DOCX format while preserving formatting ([pypi.org](https://pypi.org/project/pdf2docx/), [github.com/ArtifexSoftware](https://github.com/ArtifexSoftware/pdf2docx)).

Key capabilities:
- Extracts text, images, and drawings using PyMuPDF
- Parses layout including sections, paragraphs, images, and tables
- Generates DOCX files using python-docx
- Preserves text formatting (fonts, sizes, colors, bold, italic, underline)
- Maintains table structures and image positioning

**Vercel Deployment Constraints**:
Vercel's serverless environment has specific limitations ([vercel.com/docs](https://vercel.com/docs/functions/runtimes/python), [vercel.com/kb](https://vercel.com/kb/guide/how-to-install-system-packages-in-vercel-sandbox)):
- Sandbox includes Node.js and Python3 by default
- System packages can be installed using dnf via RunCommand
- Serverless functions have execution time limits
- Custom system dependencies require explicit configuration

## Architecture

### High-Level Architecture

```mermaid
graph TB
    Client[Client Browser] -->|Upload File| API[Next.js API Routes]
    API -->|Validate| Validator[File Validator]
    Validator -->|Store Input| Storage[(Supabase Storage)]
    Validator -->|Create Record| DB[(Supabase Database)]
    
    API -->|Word→PDF| LibreOffice[LibreOffice CLI]
    API -->|PDF→Word| Python[Python + pdf2docx]
    
    LibreOffice -->|Write| TempFS[Temporary File System]
    Python -->|Write| TempFS
    
    TempFS -->|Read Output| API
    API -->|Store Output| Storage
    API -->|Update Record| DB
    API -->|Cleanup| TempFS
    
    API -->|Generate URL| SignedURL[Signed URL Generator]
    SignedURL -->|Return| Client
    
    UI[Dashboard UI] -->|Fetch History| HistoryAPI[/api/conversions]
    UI -->|Delete Entry| DeleteAPI[/api/conversions/:id]
    HistoryAPI -->|Query| DB
    DeleteAPI -->|Remove| DB
```

### Component Interaction Flow

**Word-to-PDF Conversion Flow**:
1. Client uploads .docx file to `/api/convert/word-to-pdf`
2. API validates file type and size
3. API uploads input file to Supabase Storage (uploads bucket)
4. API creates file record and conversion record in database (status: pending)
5. API writes input file to temporary directory
6. API invokes LibreOffice CLI with headless mode
7. LibreOffice generates PDF in temporary output directory
8. API reads generated PDF from temporary directory
9. API uploads PDF to Supabase Storage (converted bucket)
10. API creates output file record and updates conversion status to completed
11. API generates signed URL for download (authenticated users) or base64 data URL (anonymous users)
12. API cleans up all temporary files
13. API returns response with download URL

**PDF-to-Word Conversion Flow**:
1. Client uploads .pdf file to `/api/convert/pdf-to-word`
2. API validates file type and size
3. API uploads input file to Supabase Storage (uploads bucket)
4. API creates file record and conversion record in database (status: pending)
5. API writes input file to temporary directory
6. API invokes Python subprocess with pdf2docx script
7. pdf2docx generates DOCX in temporary output directory
8. API reads generated DOCX from temporary directory
9. API uploads DOCX to Supabase Storage (converted bucket)
10. API creates output file record and updates conversion status to completed
11. API generates signed URL for download (authenticated users) or base64 data URL (anonymous users)
12. API cleans up all temporary files
13. API returns response with download URL

**Conversion History Delete Flow**:
1. User clicks delete button on conversion history entry
2. UI displays confirmation dialog
3. User confirms deletion
4. UI sends DELETE request to `/api/conversions/:id`
5. API verifies user owns the conversion
6. API deletes conversion record from database
7. API returns success response
8. UI removes entry from display without page refresh

## Components and Interfaces

### 1. LibreOffice Converter Service

**Purpose**: Execute LibreOffice CLI for Word-to-PDF conversion

**Location**: `src/lib/converters/libreoffice.ts`

**Interface**:
```typescript
interface LibreOfficeConversionOptions {
  inputPath: string;
  outputDir: string;
  timeout?: number; // milliseconds, default 120000
}

interface LibreOfficeConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

async function convertWordToPdf(
  options: LibreOfficeConversionOptions
): Promise<LibreOfficeConversionResult>
```

**Implementation Details**:
- Uses Node.js `child_process.spawn` to execute LibreOffice
- Command: `libreoffice --headless --convert-to pdf --outdir {outputDir} {inputPath}`
- Implements timeout mechanism using `AbortController`
- Captures stdout and stderr for logging
- Verifies output file existence after conversion
- Returns output file path on success

**Error Handling**:
- LibreOffice not installed: Return descriptive error
- Conversion timeout: Kill process and return timeout error
- Invalid input file: Return file format error
- Output file not generated: Return conversion failure error

### 2. pdf2docx Converter Service

**Purpose**: Execute Python pdf2docx for PDF-to-Word conversion

**Location**: `src/lib/converters/pdf2docx.ts`

**Interface**:
```typescript
interface Pdf2docxConversionOptions {
  inputPath: string;
  outputPath: string;
  timeout?: number; // milliseconds, default 120000
}

interface Pdf2docxConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

async function convertPdfToWord(
  options: Pdf2docxConversionOptions
): Promise<Pdf2docxConversionResult>
```

**Implementation Details**:
- Creates Python script in temporary directory
- Python script content:
  ```python
  from pdf2docx import Converter
  import sys
  
  try:
      cv = Converter(sys.argv[1])
      cv.convert(sys.argv[2])
      cv.close()
      print("SUCCESS")
  except Exception as e:
      print(f"ERROR: {str(e)}", file=sys.stderr)
      sys.exit(1)
  ```
- Uses Node.js `child_process.spawn` to execute Python script
- Command: `python3 {scriptPath} {inputPath} {outputPath}`
- Implements timeout mechanism using `AbortController`
- Captures stdout and stderr for logging
- Verifies output file existence after conversion
- Cleans up Python script after execution

**Error Handling**:
- Python not installed: Return descriptive error
- pdf2docx not installed: Return library missing error
- Conversion timeout: Kill process and return timeout error
- Invalid PDF file: Return file format error
- Output file not generated: Return conversion failure error

### 3. Temporary File Manager

**Purpose**: Manage temporary file creation and cleanup

**Location**: `src/lib/utils/tempFiles.ts`

**Interface**:
```typescript
interface TempFileOptions {
  prefix?: string;
  extension?: string;
}

interface TempFileResult {
  path: string;
  cleanup: () => Promise<void>;
}

async function createTempFile(
  content: Buffer,
  options?: TempFileOptions
): Promise<TempFileResult>

async function createTempDir(): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}>

async function cleanupTempFiles(paths: string[]): Promise<void>
```

**Implementation Details**:
- Uses Node.js `os.tmpdir()` for temporary directory location
- Generates unique filenames using `uuid` and timestamp
- Writes files using `fs.promises.writeFile`
- Creates directories using `fs.promises.mkdir` with recursive option
- Cleanup function uses `fs.promises.rm` with recursive and force options
- Implements error handling for file system operations
- Logs cleanup operations for debugging

**Temporary File Naming Convention**:
- Input files: `{uuid}-{timestamp}-input.{extension}`
- Output files: `{uuid}-{timestamp}-output.{extension}`
- Directories: `conversion-{uuid}-{timestamp}`

### 4. Conversion API Routes

**Purpose**: Handle HTTP requests for document conversion

**Locations**: 
- `app/api/convert/word-to-pdf/route.ts`
- `app/api/convert/pdf-to-word/route.ts`

**Request Interface**:
```typescript
// POST /api/convert/word-to-pdf
// POST /api/convert/pdf-to-word
// Content-Type: multipart/form-data
// Body: { file: File }
```

**Response Interface**:
```typescript
interface ConversionResponse {
  success: boolean;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  expiresAt?: string; // ISO 8601 timestamp
  error?: string;
}
```

**Implementation Flow**:
1. Extract file from form data
2. Validate file type (.docx for word-to-pdf, .pdf for pdf-to-word)
3. Validate file size (max 50 MB)
4. Get authenticated user (optional)
5. Upload input file to Supabase Storage
6. Create file record in database
7. Create conversion record with pending status (authenticated users only)
8. Create temporary files/directories
9. Execute conversion (LibreOffice or pdf2docx)
10. Read output file
11. Upload output file to Supabase Storage (authenticated users only)
12. Create output file record (authenticated users only)
13. Update conversion status to completed (authenticated users only)
14. Generate signed URL (authenticated users) or base64 data URL (anonymous users)
15. Cleanup temporary files
16. Return response

**Error Handling**:
- File validation errors: Return 400 with descriptive message
- Storage upload errors: Return 500, update conversion status to failed
- Conversion errors: Return 500, update conversion status to failed, cleanup temp files
- Database errors: Return 500, log error details
- All errors trigger temporary file cleanup

### 5. Conversion History API Routes

**Purpose**: Handle conversion history queries and deletion

**Locations**:
- `app/api/conversions/route.ts` (GET)
- `app/api/conversions/[id]/route.ts` (DELETE)

**GET /api/conversions Interface**:
```typescript
// Query Parameters
interface ConversionsQueryParams {
  page?: number;
  limit?: number;
  type?: string; // conversion_type filter
  status?: string; // status filter
  search?: string; // filename search
}

// Response
interface ConversionsResponse {
  conversions: ConversionWithFiles[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**DELETE /api/conversions/:id Interface**:
```typescript
// Path Parameter: id (conversion ID)

// Response
interface DeleteConversionResponse {
  success: boolean;
  error?: string;
}
```

**Implementation Details**:
- GET endpoint uses existing `getUserConversions` function
- DELETE endpoint:
  1. Verify user is authenticated
  2. Fetch conversion record by ID
  3. Verify user owns the conversion (user_id matches)
  4. Delete conversion record from database
  5. Return success response
- Authorization: Return 401 if not authenticated, 403 if not owner

### 6. Conversion History UI Component

**Purpose**: Display and manage conversion history

**Location**: `src/components/dashboard/ConversionHistory.tsx`

**Changes Required**:
1. **Fix Status Display**:
   - Remove any client-side status manipulation
   - Display status directly from database
   - Ensure all status values (pending, processing, completed, failed) have proper badge styling

2. **Add Delete Functionality**:
   - Add delete button to each conversion entry (top-right corner)
   - Style button with red color and trash icon
   - Implement confirmation dialog using browser `confirm()` or custom modal
   - Send DELETE request to `/api/conversions/:id` on confirmation
   - Remove entry from local state on successful deletion
   - Display error message on deletion failure

3. **Improve Placeholder Visibility**:
   - Update placeholder text color from light gray to darker gray (#6B7280 or darker)
   - Apply to search input and filter dropdowns
   - Ensure WCAG AA contrast ratio (4.5:1 minimum)

**UI Structure**:
```tsx
<div className="conversion-entry">
  <div className="entry-content">
    {/* Existing content */}
  </div>
  <button 
    className="delete-button"
    onClick={handleDelete}
    aria-label="Delete conversion"
  >
    <TrashIcon />
  </button>
</div>
```

### 7. Responsive Design Fixes

**Purpose**: Eliminate horizontal scrollbar across all viewport sizes

**Locations**: Multiple components and global styles

**Changes Required**:
1. **Global CSS** (`app/globals.css`):
   - Add `overflow-x: hidden` to body
   - Ensure no fixed-width elements exceed viewport

2. **Conversion History Component**:
   - Use responsive grid/flexbox layouts
   - Ensure table/card layouts wrap on smaller screens
   - Use `overflow-x: auto` on specific containers (not body)

3. **Navigation and Footer**:
   - Ensure responsive breakpoints work correctly
   - Test on mobile (< 768px), tablet (768-1023px), desktop (>= 1024px)

4. **Form Inputs and Buttons**:
   - Use relative units (%, rem) instead of fixed pixels
   - Ensure proper padding and margins scale with viewport

## Data Models

### Conversion Record (Database)

**Table**: `conversions`

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  input_file_id UUID REFERENCES files(id) NOT NULL,
  output_file_id UUID REFERENCES files(id),
  conversion_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

**Status Values**:
- `pending`: Conversion record created, awaiting processing
- `processing`: Conversion in progress (optional, may not be used)
- `completed`: Conversion successful, output file available
- `failed`: Conversion failed, error_message contains details

### File Record (Database)

**Table**: `files`

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Storage Buckets**:
- `uploads`: Input files uploaded by users
- `converted`: Output files generated by conversion

**Storage Path Format**:
- Authenticated users: `{user_id}/{timestamp}-{sanitized_filename}`
- Anonymous users: `anonymous/{timestamp}-{sanitized_filename}`

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request):
   - No file provided
   - Invalid file type
   - File size exceeds limit
   - Missing required fields

2. **Authentication Errors** (401 Unauthorized):
   - User not authenticated (for protected endpoints)

3. **Authorization Errors** (403 Forbidden):
   - User does not own the conversion (for delete endpoint)

4. **Not Found Errors** (404 Not Found):
   - Conversion record not found
   - File not found in storage

5. **Conversion Errors** (500 Internal Server Error):
   - LibreOffice not installed
   - Python or pdf2docx not installed
   - Conversion timeout
   - Invalid or corrupted input file
   - Output file not generated

6. **Storage Errors** (500 Internal Server Error):
   - Failed to upload file to storage
   - Failed to generate signed URL

7. **Database Errors** (500 Internal Server Error):
   - Failed to create file record
   - Failed to create conversion record
   - Failed to update conversion status

### Error Response Format

```typescript
interface ErrorResponse {
  error: string; // User-friendly error message
}
```

### Error Logging Strategy

- Log all errors to console with context (file names, user IDs, conversion IDs)
- Include stack traces for unexpected errors
- Log successful operations for audit trail
- Log temporary file cleanup operations

### Conversion Status Updates on Error

When a conversion fails:
1. Update conversion record status to 'failed'
2. Set error_message field with descriptive error
3. Set completed_at timestamp
4. Cleanup all temporary files
5. Return error response to client

## Testing Strategy

### Unit Tests

**File Validation**:
- Test file type validation (valid and invalid extensions)
- Test file size validation (within limit, exceeds limit, edge cases)
- Test missing file handling

**Temporary File Management**:
- Test temp file creation with various content types
- Test temp directory creation
- Test cleanup function removes all files
- Test cleanup handles non-existent files gracefully

**Conversion Services**:
- Test LibreOffice converter with valid input (mock subprocess)
- Test LibreOffice converter with timeout (mock subprocess)
- Test LibreOffice converter with missing dependency (mock subprocess)
- Test pdf2docx converter with valid input (mock subprocess)
- Test pdf2docx converter with timeout (mock subprocess)
- Test pdf2docx converter with missing dependency (mock subprocess)

**API Routes**:
- Test successful conversion flow (authenticated user)
- Test successful conversion flow (anonymous user)
- Test validation error responses
- Test conversion error handling
- Test storage error handling
- Test database error handling
- Test temporary file cleanup on error

**Conversion History UI**:
- Test status badge rendering for all status values
- Test delete button click triggers confirmation
- Test successful deletion removes entry from UI
- Test deletion error displays error message
- Test placeholder visibility meets contrast requirements

### Integration Tests

**End-to-End Conversion**:
- Upload real .docx file, verify PDF output quality
- Upload real .pdf file, verify DOCX output quality
- Verify formatting preservation (fonts, colors, bold, italic)
- Verify image preservation
- Verify table preservation
- Verify page layout preservation

**Storage Integration**:
- Verify files uploaded to correct buckets
- Verify file records created in database
- Verify signed URLs generated correctly
- Verify anonymous user files stored with correct prefix

**Database Integration**:
- Verify conversion records created with correct status
- Verify conversion status updates on completion
- Verify conversion status updates on failure
- Verify file records linked correctly to conversion records

**Conversion History**:
- Verify history displays correct conversions for user
- Verify pagination works correctly
- Verify filtering by type and status works
- Verify search by filename works
- Verify delete functionality removes record from database

### Manual Testing Checklist

**Conversion Quality**:
- [ ] Word-to-PDF preserves text formatting
- [ ] Word-to-PDF preserves images
- [ ] Word-to-PDF preserves tables
- [ ] Word-to-PDF preserves headers and footers
- [ ] PDF-to-Word preserves text formatting
- [ ] PDF-to-Word preserves images
- [ ] PDF-to-Word preserves tables
- [ ] PDF-to-Word preserves page layout

**Error Scenarios**:
- [ ] Invalid file type returns appropriate error
- [ ] File size exceeds limit returns appropriate error
- [ ] Conversion timeout returns appropriate error
- [ ] Missing LibreOffice returns appropriate error
- [ ] Missing Python/pdf2docx returns appropriate error

**UI Testing**:
- [ ] Pending status displays yellow badge
- [ ] Processing status displays blue badge
- [ ] Completed status displays green badge
- [ ] Failed status displays red badge
- [ ] Delete button appears in top-right corner
- [ ] Delete confirmation dialog appears
- [ ] Successful deletion removes entry without refresh
- [ ] Placeholder text is clearly visible
- [ ] No horizontal scrollbar on desktop (>= 1024px)
- [ ] No horizontal scrollbar on tablet (768-1023px)
- [ ] No horizontal scrollbar on mobile (< 768px)

**User Flows**:
- [ ] Authenticated user can convert and download file
- [ ] Anonymous user can convert and download file
- [ ] Authenticated user sees conversion in history
- [ ] Anonymous user does not see conversion in history
- [ ] User can delete conversion from history
- [ ] User cannot delete another user's conversion

## Deployment Configuration

### System Dependencies

**LibreOffice Installation**:
- Package: `libreoffice`
- Minimum version: 7.0
- Installation command (Ubuntu/Debian): `apt-get install -y libreoffice`
- Installation command (RHEL/CentOS): `dnf install -y libreoffice`

**Python Installation**:
- Package: `python3`
- Minimum version: 3.8
- Installation command (Ubuntu/Debian): `apt-get install -y python3 python3-pip`
- Installation command (RHEL/CentOS): `dnf install -y python3 python3-pip`

**pdf2docx Installation**:
- Package: `pdf2docx`
- Installation command: `pip3 install pdf2docx`
- Alternative (headless): `pip3 install pdf2docx-headless` (removes GUI dependencies)

### Vercel Configuration

**vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ],
  "functions": {
    "app/api/convert/word-to-pdf/route.ts": {
      "maxDuration": 300
    },
    "app/api/convert/pdf-to-word/route.ts": {
      "maxDuration": 300
    }
  }
}
```

**Build Configuration**:
- Runtime: Node.js 20.x
- Build command: `npm run build`
- Output directory: `.next`

**Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

### Deployment Notes

**Vercel Limitations**:
- Vercel serverless functions may not support LibreOffice installation
- Alternative: Use Docker container or external conversion service
- Consider AWS Lambda with custom runtime or EC2 instance for LibreOffice

**Recommended Deployment Strategy**:
1. **Option A**: Deploy to platform with full system package support (AWS EC2, DigitalOcean, Heroku)
2. **Option B**: Use Docker container with LibreOffice pre-installed
3. **Option C**: Implement external conversion service (microservice architecture)

**For Vercel Deployment**:
- Document LibreOffice limitation in README
- Provide alternative deployment instructions
- Consider using external API for LibreOffice conversion (e.g., CloudConvert, Zamzar)

### Package.json Updates

**Dependencies to Remove**:
```json
{
  "mammoth": "^1.12.0",  // Remove
  "pdf2json": "^4.0.3",  // Remove
  "docx": "^9.6.1"       // Remove
}
```

**Dependencies to Keep**:
```json
{
  "pdf-lib": "^1.17.1"   // Keep for future PDF manipulation features
}
```

**Dependencies to Add**:
None (LibreOffice and pdf2docx are system-level dependencies)

## Migration Strategy

### Phase 1: Backend Conversion Logic

1. Create converter services:
   - `src/lib/converters/libreoffice.ts`
   - `src/lib/converters/pdf2docx.ts`
2. Create temporary file manager:
   - `src/lib/utils/tempFiles.ts`
3. Write unit tests for converter services
4. Write unit tests for temporary file manager

### Phase 2: API Route Updates

1. Update `app/api/convert/word-to-pdf/route.ts`:
   - Replace mammoth.js + pdf-lib logic with LibreOffice converter
   - Add temporary file management
   - Add timeout handling
   - Update error handling
2. Update `app/api/convert/pdf-to-word/route.ts`:
   - Replace pdf2json + docx logic with pdf2docx converter
   - Add temporary file management
   - Add timeout handling
   - Update error handling
3. Write integration tests for API routes

### Phase 3: UI Improvements

1. Fix conversion history status display:
   - Remove client-side status manipulation
   - Verify status badge styling for all values
2. Add delete functionality:
   - Create DELETE endpoint at `app/api/conversions/[id]/route.ts`
   - Add delete button to ConversionHistory component
   - Implement confirmation dialog
   - Handle deletion errors
3. Improve placeholder visibility:
   - Update CSS for search input
   - Update CSS for filter dropdowns
   - Verify contrast ratios
4. Fix responsive design:
   - Add overflow-x: hidden to body
   - Fix ConversionHistory component layout
   - Test on multiple viewport sizes

### Phase 4: Testing and Validation

1. Run unit tests
2. Run integration tests
3. Perform manual testing with real documents
4. Verify conversion quality (formatting, images, tables)
5. Verify error handling
6. Verify UI improvements
7. Verify responsive design

### Phase 5: Deployment

1. Update deployment configuration
2. Install system dependencies (LibreOffice, Python, pdf2docx)
3. Deploy to staging environment
4. Perform smoke tests
5. Deploy to production
6. Monitor error logs
7. Monitor conversion success rates

### Rollback Plan

If issues are discovered after deployment:
1. Revert API route changes to use old libraries
2. Revert UI changes if necessary
3. Keep new converter services for future use
4. Document issues and plan fixes
5. Redeploy after fixes are validated

## Backward Compatibility

### API Contract Preservation

**Endpoints**:
- `POST /api/convert/word-to-pdf` (unchanged)
- `POST /api/convert/pdf-to-word` (unchanged)

**Request Format**:
- Content-Type: `multipart/form-data` (unchanged)
- Field name: `file` (unchanged)

**Response Format**:
```typescript
{
  success: boolean,
  fileName: string,
  fileSize: string,
  downloadUrl: string,
  expiresAt?: string
}
```
All fields remain unchanged.

**Error Response Format**:
```typescript
{
  error: string
}
```
Format unchanged, error messages may be more descriptive.

### Client Impact

**No Changes Required**:
- Frontend components continue to work without modification
- Existing API calls remain compatible
- Response parsing logic unchanged

**Improved User Experience**:
- Better conversion quality (formatting, images, tables preserved)
- More descriptive error messages
- Fixed status display in conversion history
- Delete functionality for conversion history
- Better placeholder visibility
- No horizontal scrollbar

## Security Considerations

### Input Validation

- Validate file extensions before processing
- Validate file size limits (50 MB)
- Sanitize filenames before storage
- Validate user authentication for protected endpoints
- Validate user authorization for delete operations

### Temporary File Security

- Use unique, unpredictable filenames (UUID + timestamp)
- Store temporary files in system temp directory
- Clean up temporary files immediately after use
- Clean up temporary files on error
- Implement file system permissions (read/write only for process)

### Command Injection Prevention

- Use `child_process.spawn` with argument array (not shell string)
- Validate and sanitize all file paths
- Do not pass user input directly to shell commands
- Use absolute paths for executables

### Storage Security

- Use Supabase Row Level Security (RLS) policies
- Verify user owns files before allowing access
- Generate signed URLs with expiration (1 hour)
- Store anonymous user files with separate prefix
- Implement file cleanup cron job for old files

### Error Message Security

- Do not expose system paths in error messages
- Do not expose internal error details to clients
- Log detailed errors server-side only
- Return generic error messages for unexpected errors

## Performance Considerations

### Conversion Timeouts

- LibreOffice conversion: 120 seconds timeout
- pdf2docx conversion: 120 seconds timeout
- Implement timeout using AbortController
- Kill subprocess on timeout
- Clean up temporary files on timeout

### File Size Limits

- Maximum file size: 50 MB
- Validate before processing
- Consider streaming for large files (future enhancement)

### Temporary File Cleanup

- Clean up immediately after conversion
- Clean up on error
- Implement cron job for orphaned files
- Monitor disk space usage

### Concurrent Conversions

- Serverless functions handle concurrency automatically
- Each conversion uses isolated temporary directory
- No shared state between conversions
- Consider rate limiting for abuse prevention (future enhancement)

### Caching Strategy

- No caching for conversion results (each conversion is unique)
- Cache signed URLs for 1 hour (built into Supabase)
- Consider caching conversion history queries (future enhancement)

## Monitoring and Observability

### Metrics to Track

- Conversion success rate (by type)
- Conversion failure rate (by type)
- Average conversion time (by type)
- File size distribution
- Error types and frequencies
- Temporary file cleanup success rate
- API response times
- Storage usage

### Logging Strategy

**Successful Conversions**:
```
[INFO] Conversion started: type={conversion_type}, user={user_id}, file={filename}
[INFO] File uploaded: path={storage_path}, size={file_size}
[INFO] Conversion completed: duration={duration_ms}, output={output_filename}
```

**Failed Conversions**:
```
[ERROR] Conversion failed: type={conversion_type}, user={user_id}, file={filename}, error={error_message}
[ERROR] Temporary file cleanup failed: path={temp_path}, error={error_message}
```

**Deletion Operations**:
```
[INFO] Conversion deleted: id={conversion_id}, user={user_id}
[ERROR] Deletion failed: id={conversion_id}, user={user_id}, error={error_message}
```

### Alerting

- Alert on conversion failure rate > 10%
- Alert on average conversion time > 60 seconds
- Alert on disk space usage > 80%
- Alert on temporary file cleanup failures

## Future Enhancements

### Potential Improvements

1. **Batch Conversion**: Support multiple file uploads
2. **Progress Tracking**: Real-time conversion progress updates via WebSocket
3. **Advanced Options**: Allow users to specify conversion settings (page range, quality, etc.)
4. **Format Support**: Add support for more formats (PPT, XLS, etc.)
5. **OCR Support**: Add OCR for scanned PDFs
6. **Conversion History Export**: Allow users to export conversion history as CSV
7. **File Preview**: Show preview of converted file before download
8. **Conversion Templates**: Save and reuse conversion settings
9. **API Rate Limiting**: Implement rate limiting for abuse prevention
10. **Conversion Queue**: Implement queue system for high-volume conversions

### Technical Debt

1. **Search Optimization**: Implement database-level search instead of in-memory filtering
2. **Pagination Optimization**: Use cursor-based pagination for better performance
3. **Caching**: Implement Redis caching for conversion history queries
4. **Microservices**: Extract conversion logic into separate microservice
5. **Docker**: Create Docker image with LibreOffice and pdf2docx pre-installed
6. **Testing**: Add property-based tests for conversion quality validation

## Conclusion

This design provides a comprehensive approach to migrating the document conversion feature from basic text-extraction libraries to high-fidelity conversion tools while maintaining backward compatibility and improving the user experience. The architecture supports both authenticated and anonymous users, implements robust error handling, and ensures proper cleanup of temporary files.

The UI improvements address specific user pain points including status display bugs, lack of delete functionality, poor placeholder visibility, and horizontal scrollbar issues. The responsive design fixes ensure a consistent experience across all viewport sizes.

The deployment strategy acknowledges the limitations of serverless platforms like Vercel and provides alternative deployment options for full system package support. The migration strategy breaks the work into manageable phases with clear testing and validation steps.
