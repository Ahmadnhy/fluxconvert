# Implementation Plan: Library Migration and Document Conversion

## Overview

This implementation plan migrates the document conversion feature from basic text-extraction libraries (mammoth.js + pdf-lib for Word-to-PDF, pdf2json + docx for PDF-to-Word) to high-fidelity conversion tools (LibreOffice CLI for Word-to-PDF, pdf2docx for PDF-to-Word). The migration preserves formatting, images, tables, and other document elements while maintaining backward compatibility. Additionally, this plan includes UI improvements for conversion history, placeholder visibility, and responsive design fixes.

## Tasks

- [x] 1. Create temporary file management utility
  - Create `src/lib/utils/tempFiles.ts` with functions for creating temp files, temp directories, and cleanup
  - Implement `createTempFile` function that generates unique filenames using UUID and timestamp
  - Implement `createTempDir` function that creates temporary directories with unique names
  - Implement `cleanupTempFiles` function that removes files and directories with error handling
  - Use Node.js `os.tmpdir()` for temporary directory location
  - Use `fs.promises` for async file operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 1.1 Write unit tests for temporary file manager
  - Test temp file creation with various content types
  - Test temp directory creation
  - Test cleanup function removes all files
  - Test cleanup handles non-existent files gracefully
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 2. Create LibreOffice converter service
  - Create `src/lib/converters/libreoffice.ts` with TypeScript interfaces and conversion function
  - Implement `convertWordToPdf` function using Node.js `child_process.spawn`
  - Execute command: `libreoffice --headless --convert-to pdf --outdir {outputDir} {inputPath}`
  - Implement timeout mechanism using `AbortController` (default 120 seconds)
  - Capture stdout and stderr for logging
  - Verify output file existence after conversion
  - Return output file path on success or error message on failure
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3, 3.4, 3.5, 13.1, 13.3, 13.5_

- [x] 2.1 Write unit tests for LibreOffice converter
  - Test successful conversion with mocked subprocess
  - Test timeout handling with mocked subprocess
  - Test missing LibreOffice dependency error
  - Test invalid input file error
  - Test output file verification
  - _Requirements: 1.1, 1.6, 1.7, 3.1, 3.2, 13.1, 13.3, 13.5_

- [x] 3. Create pdf2docx converter service
  - Create `src/lib/converters/pdf2docx.ts` with TypeScript interfaces and conversion function
  - Implement `convertPdfToWord` function that creates Python script in temporary directory
  - Python script uses pdf2docx library to convert PDF to DOCX
  - Execute Python script using Node.js `child_process.spawn`: `python3 {scriptPath} {inputPath} {outputPath}`
  - Implement timeout mechanism using `AbortController` (default 120 seconds)
  - Capture stdout and stderr for logging
  - Verify output file existence after conversion
  - Clean up Python script after execution
  - Return output file path on success or error message on failure
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 13.2, 13.3, 13.5_

- [x] 3.1 Write unit tests for pdf2docx converter
  - Test successful conversion with mocked subprocess
  - Test timeout handling with mocked subprocess
  - Test missing Python dependency error
  - Test missing pdf2docx library error
  - Test invalid PDF file error
  - Test output file verification
  - _Requirements: 2.1, 2.6, 2.7, 4.1, 4.2, 4.3, 13.2, 13.3, 13.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update Word-to-PDF API route
  - Update `app/api/convert/word-to-pdf/route.ts` to use LibreOffice converter
  - Remove mammoth.js and pdf-lib conversion logic
  - Import and use `convertWordToPdf` from `src/lib/converters/libreoffice.ts`
  - Import and use temporary file management functions from `src/lib/utils/tempFiles.ts`
  - Create temporary input file from uploaded buffer
  - Create temporary output directory
  - Call LibreOffice converter with input and output paths
  - Read generated PDF from temporary directory
  - Upload PDF to Supabase Storage (converted bucket)
  - Clean up all temporary files in finally block (success or error)
  - Update error handling to include LibreOffice-specific errors
  - Maintain existing API contract (request/response format unchanged)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.3, 13.4, 13.5_

- [x] 5.1 Write integration tests for Word-to-PDF route
  - Test successful conversion with real .docx file
  - Test file type validation (invalid extension)
  - Test file size validation (exceeds limit)
  - Test missing file error
  - Test conversion timeout handling
  - Test temporary file cleanup on error
  - Test authenticated user flow (storage upload, database records)
  - Test anonymous user flow (base64 response)
  - _Requirements: 1.1, 1.6, 1.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 13.1, 13.3, 13.4, 13.5_

- [x] 6. Update PDF-to-Word API route
  - Update `app/api/convert/pdf-to-word/route.ts` to use pdf2docx converter
  - Remove pdf2json and docx library conversion logic
  - Import and use `convertPdfToWord` from `src/lib/converters/pdf2docx.ts`
  - Import and use temporary file management functions from `src/lib/utils/tempFiles.ts`
  - Create temporary input file from uploaded buffer
  - Create temporary output file path
  - Call pdf2docx converter with input and output paths
  - Read generated DOCX from temporary directory
  - Upload DOCX to Supabase Storage (converted bucket)
  - Clean up all temporary files in finally block (success or error)
  - Update error handling to include pdf2docx-specific errors
  - Maintain existing API contract (request/response format unchanged)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.2, 13.3, 13.4, 13.5_

- [x] 6.1 Write integration tests for PDF-to-Word route
  - Test successful conversion with real .pdf file
  - Test file type validation (invalid extension)
  - Test file size validation (exceeds limit)
  - Test missing file error
  - Test conversion timeout handling
  - Test temporary file cleanup on error
  - Test authenticated user flow (storage upload, database records)
  - Test anonymous user flow (base64 response)
  - _Requirements: 2.1, 2.6, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 13.2, 13.3, 13.4, 13.5_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create DELETE endpoint for conversion history
  - Create `app/api/conversions/[id]/route.ts` with DELETE handler
  - Verify user is authenticated (return 401 if not)
  - Fetch conversion record by ID from database
  - Verify user owns the conversion (user_id matches, return 403 if not)
  - Delete conversion record from database
  - Return success response with `{ success: true }`
  - Return error response with `{ error: string }` on failure
  - Log deletion operations for audit trail
  - _Requirements: 17.8, 17.9, 17.10_

- [x] 8.1 Write integration tests for DELETE endpoint
  - Test successful deletion by owner
  - Test 401 error for unauthenticated user
  - Test 403 error for non-owner
  - Test 404 error for non-existent conversion
  - Test database deletion verification
  - _Requirements: 17.8, 17.9, 17.10_

- [x] 9. Fix conversion history status display
  - Update `src/components/dashboard/ConversionHistory.tsx` to remove any client-side status manipulation
  - Ensure status is displayed directly from database without modification
  - Verify `getStatusBadge` function handles all status values: pending, processing, completed, failed
  - Ensure pending status displays yellow badge with "Pending" label
  - Ensure processing status displays blue badge with "Processing" label
  - Ensure completed status displays green badge with "Completed" label
  - Ensure failed status displays red badge with "Failed" label
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 10. Add delete functionality to conversion history
  - Update `src/components/dashboard/ConversionHistory.tsx` to add delete button to each conversion entry
  - Position delete button in top-right corner of conversion entry card
  - Style button with red color (#EF4444 or similar) and trash icon
  - Implement `handleDelete` function that displays confirmation dialog
  - Use browser `confirm()` with message: "Are you sure you want to delete this conversion?"
  - Send DELETE request to `/api/conversions/:id` on confirmation
  - Remove entry from local state on successful deletion (no page refresh)
  - Display error message on deletion failure
  - Add loading state during deletion (disable button, show spinner)
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [x] 10.1 Write unit tests for delete functionality
  - Test delete button renders for each conversion
  - Test confirmation dialog appears on button click
  - Test DELETE request sent on confirmation
  - Test entry removed from UI on success
  - Test error message displayed on failure
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [x] 11. Improve placeholder visibility in conversion history
  - Update `src/components/dashboard/ConversionHistory.tsx` to change placeholder text color
  - Update search input placeholder color to darker gray (#6B7280 or darker)
  - Update "All Types" filter dropdown placeholder color to darker gray
  - Update "All Status" filter dropdown placeholder color to darker gray
  - Use Tailwind CSS `placeholder:text-gray-600` or similar utility class
  - Ensure placeholder text remains distinguishable from actual input values
  - Verify WCAG AA contrast ratio (minimum 4.5:1) for accessibility
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [x] 12. Fix responsive design to remove horizontal scrollbar
  - Update `app/globals.css` to add `overflow-x: hidden` to body element
  - Review `src/components/dashboard/ConversionHistory.tsx` for fixed-width elements
  - Ensure conversion history cards use responsive layouts (flexbox/grid with wrapping)
  - Update conversion entry cards to use `flex-col` on mobile, `flex-row` on desktop
  - Ensure all text elements wrap properly (use `break-words` or `overflow-wrap: break-word`)
  - Test on mobile viewport (< 768px) to verify no horizontal scroll
  - Test on tablet viewport (768-1023px) to verify no horizontal scroll
  - Test on desktop viewport (>= 1024px) to verify no horizontal scroll
  - Ensure navigation bar and footer do not cause overflow
  - Use relative units (%, rem) instead of fixed pixels where appropriate
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Update package.json to remove legacy libraries
  - Remove `mammoth` dependency from package.json
  - Remove `pdf2json` dependency from package.json
  - Remove `docx` dependency from package.json
  - Keep `pdf-lib` dependency for future PDF manipulation features
  - Run `npm install` to update package-lock.json
  - Verify no import statements reference removed libraries
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 15. Update deployment configuration
  - Update `vercel.json` to set function timeout to 300 seconds for conversion routes
  - Add function configuration for `app/api/convert/word-to-pdf/route.ts`
  - Add function configuration for `app/api/convert/pdf-to-word/route.ts`
  - Document LibreOffice installation requirement in README or deployment docs
  - Document Python 3 installation requirement
  - Document pdf2docx installation requirement (`pip3 install pdf2docx`)
  - Note Vercel limitations and recommend alternative deployment platforms (AWS EC2, DigitalOcean, Docker)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 16. Final checkpoint - Manual testing and validation
  - Test Word-to-PDF conversion with real documents (verify formatting, images, tables preserved)
  - Test PDF-to-Word conversion with real documents (verify formatting, images, tables preserved)
  - Test file validation errors (invalid type, size exceeds limit)
  - Test conversion timeout scenarios
  - Test authenticated user flow (storage, database, signed URLs)
  - Test anonymous user flow (base64 response)
  - Test conversion history displays correct status badges
  - Test delete functionality removes entries
  - Test placeholder visibility meets contrast requirements
  - Test responsive design on mobile, tablet, and desktop viewports
  - Verify no horizontal scrollbar on any viewport size
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- LibreOffice and pdf2docx must be installed on the deployment environment
- Vercel may not support LibreOffice installation; consider alternative deployment platforms
- The implementation maintains backward compatibility with existing API contracts
- Temporary files are cleaned up in all scenarios (success, error, timeout)
- UI improvements enhance user experience without breaking existing functionality
