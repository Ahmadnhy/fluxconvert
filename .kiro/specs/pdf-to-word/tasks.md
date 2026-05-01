# Implementation Plan: PDF to Word Converter

## Overview

This implementation plan converts the PDF to Word converter design into actionable coding tasks. The feature enables users to convert PDF files to Microsoft Word (.docx) format through a web interface, mirroring the existing Word to PDF conversion functionality. The implementation follows an 8-phase approach: dependencies setup, API implementation, frontend component, page component, navigation integration, testing, manual testing, and documentation.

## Tasks

- [x] 1. Set up dependencies and verify infrastructure
  - Install required npm packages: `pdf-parse` and `docx`
  - Install TypeScript types: `@types/pdf-parse`
  - Verify Supabase storage buckets exist (`uploads`, `converted`)
  - Verify database tables exist (`files`, `conversions`)
  - Verify existing utility functions are available (storage operations, signed URLs)
  - _Requirements: 14.4_

- [x] 2. Implement PDF to Word conversion API endpoint
  - [x] 2.1 Create API route handler at `app/api/convert/pdf-to-word/route.ts`
    - Set up Next.js route handler with Node.js runtime
    - Configure dynamic rendering (`force-dynamic`)
    - Export POST function for handling conversion requests
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 2.2 Implement request validation
    - Extract file from FormData
    - Validate file exists (return 400 if missing)
    - Validate file has .pdf extension (return 400 if invalid)
    - Validate file size ≤ 50MB (return 400 if exceeded)
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 12.1, 12.2, 12.3_

  - [x] 2.3 Implement authentication check and user identification
    - Create Supabase client using `createClient()`
    - Retrieve authenticated user from session
    - Set `userId` to user ID or null for anonymous users
    - _Requirements: 13.3, 13.4, 13.5_

  - [x] 2.4 Implement input file storage upload
    - Generate storage path using pattern `{userId}/{timestamp}-{sanitized_filename}` or `anonymous/{timestamp}-{sanitized_filename}`
    - Sanitize filename by replacing non-alphanumeric characters (except dots and hyphens) with underscores
    - Upload PDF file to `uploads` bucket
    - Handle storage upload errors (return 500 if failed)
    - _Requirements: 4.1, 4.3, 4.6, 6.2, 12.4, 17.1, 17.2, 17.3_

  - [x] 2.5 Implement database record creation for input file
    - Create file record in `files` table with metadata (name, type, size, storage path, bucket)
    - Set `user_id` to authenticated user ID or null for anonymous users
    - Handle database errors (return 500 if failed)
    - _Requirements: 4.2, 6.5, 12.5_

  - [x] 2.6 Create conversion record for authenticated users
    - Create conversion record in `conversions` table with status "pending"
    - Set `conversion_type` to "pdf-to-word"
    - Reference input file record
    - Skip for anonymous users
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.7 Implement PDF parsing with pdf-parse library
    - Convert file to Buffer using `Buffer.from(await file.arrayBuffer())`
    - Parse PDF using `pdfParse(buffer)`
    - Extract text content from parsed data
    - Handle empty content (return error if no extractable text)
    - Handle PDF parsing errors (return 500 with descriptive message)
    - _Requirements: 3.1, 3.2, 12.6_

  - [x] 2.8 Implement DOCX generation with docx library
    - Split text content into paragraphs using double newline as delimiter
    - Create Paragraph objects with TextRun children for each paragraph
    - Create Document with sections containing paragraphs
    - Generate DOCX buffer using `Packer.toBuffer(doc)`
    - Handle DOCX generation errors (return 500 with descriptive message)
    - _Requirements: 3.3, 3.4, 3.5, 12.7_

  - [x] 2.9 Implement output file storage for authenticated users
    - Generate output filename by replacing .pdf with .docx
    - Upload DOCX buffer to `converted` bucket
    - Create file record for output file
    - Update conversion record with output file reference
    - Update conversion status to "completed"
    - Set `completed_at` timestamp
    - Skip storage for anonymous users
    - _Requirements: 4.4, 4.5, 5.4, 5.5, 5.6_

  - [x] 2.10 Implement response generation with download URL
    - For authenticated users: generate signed URL with 3600 second expiration
    - For authenticated users: include `expiresAt` timestamp in response
    - Fallback to base64-encoded data URL if signed URL generation fails
    - For anonymous users: return base64-encoded data URL
    - Return success response with fileName, fileSize, downloadUrl, and optional expiresAt
    - _Requirements: 3.6, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 14.6_

  - [x] 2.11 Implement comprehensive error handling
    - Handle conversion failures by updating conversion record status to "failed"
    - Store error messages in conversion record
    - Return JSON error responses with appropriate HTTP status codes
    - Add logging for all error scenarios
    - _Requirements: 5.7, 5.8, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 14.7_

- [x] 3. Checkpoint - Verify API implementation
  - Test API endpoint manually with sample PDF files
  - Verify authenticated and anonymous user flows work correctly
  - Ensure all error scenarios return appropriate responses
  - Check database records are created correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement PDF to Word converter frontend component
  - [x] 4.1 Create PdfToWordConverter component at `src/components/converters/PdfToWordConverter.tsx`
    - Set up React component with TypeScript
    - Define state interfaces: `UploadedFile` and `ConversionStatus`
    - Initialize state for uploaded files, conversion status, progress, and authentication
    - _Requirements: 20.2_

  - [x] 4.2 Implement file upload UI with drag-and-drop
    - Integrate `react-dropzone` for file upload handling
    - Configure accept to only allow .pdf files
    - Configure maxSize to 50MB
    - Implement drag-over visual feedback
    - Implement click-to-browse option
    - Handle single file selection (accept only first file if multiple)
    - Display uploaded file preview with name and size
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 20.3_

  - [x] 4.3 Implement client-side file validation
    - Validate file type (.pdf extension)
    - Validate file size (≤ 50MB)
    - Display error messages for invalid files
    - Prevent upload for invalid files
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

  - [x] 4.4 Implement conversion process and API integration
    - Create FormData with uploaded file
    - Send POST request to `/api/convert/pdf-to-word`
    - Handle API response (success and error cases)
    - Parse response JSON for download URL and metadata
    - _Requirements: 3.6, 14.2, 14.3_

  - [x] 4.5 Implement conversion progress tracking
    - Display "Uploading file..." status during upload (0-30% progress)
    - Display "Converting to Word..." status during conversion (30-60% progress)
    - Display "Conversion completed!" status on success (100% progress)
    - Update progress bar smoothly through stages
    - Display error messages on failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x] 4.6 Implement download functionality
    - Display "Download Word" button when conversion completes
    - Trigger file download on button click
    - Set download filename to original name with .docx extension
    - Display "Convert Another" button after download
    - Reset to initial state when "Convert Another" is clicked
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.7 Implement error display
    - Display error messages in red alert box with error icon
    - Show clear, actionable error messages
    - Provide retry option on error
    - _Requirements: 12.8_

  - [x] 4.8 Implement authentication-aware UI
    - Check authentication status using Supabase client
    - Display user profile component for authenticated users
    - Display "Login" and "Sign Up" buttons for anonymous users
    - _Requirements: 13.1, 13.2_

  - [x] 4.9 Add animations and styling
    - Integrate `framer-motion` for transitions and animations
    - Apply color scheme matching Word to PDF converter (#5b8ba8)
    - Match layout structure from Word to PDF converter
    - Style drag-and-drop component consistently
    - Display feature cards (Secure & Private, Fast Conversion, High Quality)
    - Apply consistent button styles and hover effects
    - Style progress bar to match existing converter
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [x] 5. Create PDF to Word converter page component
  - [x] 5.1 Create page component at `app/pdf-to-word/page.tsx`
    - Create Next.js server component
    - Import and render PdfToWordConverter component
    - _Requirements: 11.2_

  - [x] 5.2 Add page metadata
    - Set page title to "PDF to Word Converter | FluxConvert"
    - Set description explaining the conversion feature
    - _Requirements: 11.3, 11.4_

  - [x] 5.3 Verify page structure
    - Ensure standard navigation bar is included
    - Ensure standard footer with Privacy, Terms, and Help Center links is included
    - _Requirements: 11.5, 11.6_

- [x] 6. Integrate PDF to Word link into navigation
  - [x] 6.1 Update navigation component to include PDF to Word link
    - Add "PDF to Word" link to navigation menu
    - Set link href to `/pdf-to-word`
    - Match styling with existing navigation links
    - _Requirements: 11.1, 11.2_

- [x] 7. Checkpoint - Verify frontend implementation
  - Test file upload with drag-and-drop and click-to-browse
  - Verify progress tracking displays correctly
  - Test download functionality with sample conversions
  - Verify error messages display properly
  - Check authentication state transitions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement property-based tests for API
  - [ ]* 8.1 Write property test for text content preservation
    - **Property 1: Text Content Preservation**
    - **Validates: Requirements 3.1, 3.4, 15.1, 15.2, 15.3**
    - Generate arbitrary valid PDF files with text content
    - Verify converted DOCX contains extracted text with character count > 0 and word count > 0
    - Use fast-check with 100 iterations

  - [ ]* 8.2 Write property test for paragraph structure preservation
    - **Property 2: Paragraph Structure Preservation**
    - **Validates: Requirements 3.5**
    - Generate PDFs with identifiable paragraph boundaries
    - Verify DOCX maintains same number of paragraph breaks
    - Use fast-check with 100 iterations

  - [ ]* 8.3 Write property test for valid DOCX generation
    - **Property 3: Valid DOCX Generation**
    - **Validates: Requirements 3.3, 15.4**
    - Generate arbitrary valid PDF inputs
    - Verify DOCX output has size > 0 bytes and is valid format
    - Use fast-check with 100 iterations

  - [ ]* 8.4 Write property test for file extension transformation
    - **Property 4: File Extension Transformation**
    - **Validates: Requirements 15.5, 15.6, 18.2**
    - Generate arbitrary filenames with .pdf extension
    - Verify output filename has .docx extension replacing .pdf
    - Use fast-check with 100 iterations

  - [ ]* 8.5 Write property test for error handling
    - **Property 5: Error Handling**
    - **Validates: Requirements 3.7, 18.5**
    - Generate invalid or corrupted PDF inputs
    - Verify API returns non-empty descriptive error message
    - Use fast-check with 100 iterations

  - [ ]* 8.6 Write property test for successful response structure
    - **Property 6: Successful Response Structure**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4**
    - Generate valid PDF inputs
    - Verify response contains success=true, fileName (ends in .docx), fileSize (non-empty), downloadUrl (non-empty)
    - Use fast-check with 100 iterations

  - [ ]* 8.7 Write property test for file record creation
    - **Property 7: File Record Creation**
    - **Validates: Requirements 16.1, 16.2**
    - Generate authenticated user conversions
    - Verify two file records exist: input in "uploads" bucket, output in "converted" bucket
    - Use fast-check with 100 iterations

  - [ ]* 8.8 Write property test for conversion record integrity
    - **Property 8: Conversion Record Integrity**
    - **Validates: Requirements 16.3, 16.6**
    - Generate authenticated user conversions
    - Verify conversion record exists with valid status and output_file_id references valid file record
    - Use fast-check with 100 iterations

  - [ ]* 8.9 Write property test for timestamp ordering
    - **Property 9: Timestamp Ordering**
    - **Validates: Requirements 16.4**
    - Generate completed conversions
    - Verify completed_at > created_at for all records
    - Use fast-check with 100 iterations

  - [ ]* 8.10 Write property test for error message presence
    - **Property 10: Error Message Presence**
    - **Validates: Requirements 16.5**
    - Generate failed conversions
    - Verify error_message field contains non-empty string
    - Use fast-check with 100 iterations

  - [ ]* 8.11 Write property test for storage path patterns
    - **Property 11: Storage Path Patterns**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
    - Generate file uploads for authenticated and anonymous users
    - Verify storage paths match required patterns with sanitized filenames
    - Use fast-check with 100 iterations

  - [ ]* 8.12 Write property test for authenticated user response metadata
    - **Property 12: Authenticated User Response Metadata**
    - **Validates: Requirements 18.6**
    - Generate authenticated user conversions with signed URLs
    - Verify response includes expiresAt field with valid ISO 8601 timestamp
    - Use fast-check with 100 iterations

- [ ] 9. Implement unit tests for API
  - [ ]* 9.1 Write validation tests
    - Test missing file returns 400 with "No file provided"
    - Test invalid file type returns 400 with "Only .pdf files are supported"
    - Test file size exceeded returns 400 with "File size exceeds 50 MB limit"
    - Test valid file passes validation
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 9.2 Write edge case tests
    - Test empty PDF (no text content)
    - Test PDF with only whitespace
    - Test PDF with special characters
    - Test very small PDF (< 1KB)
    - Test large PDF (close to 50MB limit)
    - Test PDF with multiple pages
    - Test PDF with single page
    - Test PDF with various paragraph structures
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 9.3 Write integration tests for authenticated users
    - Test complete authenticated user flow (upload → convert → store → signed URL)
    - Test file records created in database
    - Test conversion record created and updated
    - Test signed URL generation
    - Test signed URL expiration timestamp
    - Test base64 fallback when signed URL fails
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.4 Write integration tests for anonymous users
    - Test complete anonymous user flow (upload → convert → return data URL)
    - Test no conversion record created
    - Test file records created with null user_id
    - Test base64 data URL returned
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.5 Write error handling tests
    - Test storage upload failure returns 500
    - Test database operation failure returns 500
    - Test PDF parsing failure returns 500 with descriptive message
    - Test DOCX generation failure returns 500 with descriptive message
    - Test conversion record updated to "failed" on error
    - Test error message stored in conversion record
    - _Requirements: 5.7, 5.8, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 9.6 Run test suite and verify coverage
    - Execute all unit tests
    - Verify line coverage > 80%
    - Verify branch coverage > 75%
    - Verify function coverage > 85%
    - Fix any failing tests

- [ ] 10. Implement component tests for frontend
  - [ ]* 10.1 Write file upload interaction tests
    - Test drag-and-drop file upload
    - Test click-to-browse file selection
    - Test file preview display
    - Test single file selection (reject multiple files)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 10.2 Write validation feedback tests
    - Test invalid file type error display
    - Test file size exceeded error display
    - Test validation prevents upload for invalid files
    - _Requirements: 1.2, 2.1, 2.2, 2.3_

  - [ ]* 10.3 Write progress display tests
    - Test progress bar updates through stages (0% → 30% → 60% → 100%)
    - Test status messages display correctly
    - Test error message display on failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 10.4 Write download functionality tests
    - Test download button appears on success
    - Test download triggers file download
    - Test filename has .docx extension
    - Test "Convert Another" button resets state
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 10.5 Write authentication UI tests
    - Test user profile displays for authenticated users
    - Test login/signup buttons display for anonymous users
    - _Requirements: 13.1, 13.2_

- [x] 11. Update dashboard to display PDF to Word conversions
  - [x] 11.1 Update ConversionHistory component to handle pdf-to-word conversion type
    - Display "PDF to Word" as conversion type label for pdf-to-word conversions
    - Add "PDF to Word" as filter option
    - Display input file name and output file name
    - Display conversion status (completed, pending, failed)
    - Generate fresh signed URL on download click
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 12. Checkpoint - Verify complete implementation
  - Run full test suite (property tests + unit tests + component tests)
  - Verify all tests pass
  - Check test coverage meets goals (>80% line coverage)
  - Test complete user flows manually
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and integration scenarios
- The implementation follows the existing Word to PDF converter patterns for consistency
- TypeScript is used throughout for type safety
- All database and storage operations reuse existing infrastructure
- Manual testing and documentation tasks are intentionally excluded as they cannot be performed by a coding agent

