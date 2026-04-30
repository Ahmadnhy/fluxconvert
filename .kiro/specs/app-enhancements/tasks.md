# Implementation Plan: App Enhancements

## Overview

This implementation plan transforms the FluxConvert application from a simple conversion tool into a comprehensive document management platform. The enhancements include improved navigation, landing page redesign, conversion history tracking with Supabase Storage integration, rate limiting, and automated file cleanup. The implementation follows a 6-phase approach to ensure incremental progress and early validation.

## Tasks

### Phase 1: Navigation and UI Updates

- [ ] 1. Update navigation component
  - [x] 1.1 Remove Developer API and Pricing links from navigation
    - Update `app/layout.tsx` to remove Developer API and Pricing menu items
    - Add Dashboard link to navigation bar
    - Ensure navigation links to Privacy, Terms, and Help Center pages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.2 Write unit tests for navigation component
    - Test navigation renders correct links based on auth state
    - Test Dashboard link appears and navigates correctly
    - Test static page links are present
    - _Requirements: 1.1, 1.4, 1.6_

- [ ] 2. Redesign home page
  - [x] 2.1 Remove file drop zone from home page
    - Update `src/components/home.tsx` to remove file upload functionality
    - Replace with hero section containing welcome message and app description
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [x] 2.2 Add conversion tool grid to home page
    - Create grid layout displaying available conversion tools
    - Add Word to PDF card with icon and description
    - Add navigation links to specific conversion pages
    - _Requirements: 2.4, 2.5_
  
  - [x] 2.3 Write unit tests for home component
    - Test file drop zone is not rendered
    - Test tool grid displays correctly
    - Test navigation links work
    - _Requirements: 2.1, 2.2, 2.4_

- [ ] 3. Redesign dashboard page
  - [x] 3.1 Remove file drop zone from dashboard
    - Update `app/dashboard/page.tsx` to remove file upload functionality
    - Add personalized welcome message using user email
    - Implement server-side authentication check with redirect to /login
    - _Requirements: 3.1, 3.2, 3.3, 3.6_
  
  - [x] 3.2 Add quick action cards to dashboard
    - Create quick action card components for conversion tools
    - Display Word to PDF card with navigation
    - Ensure cards are clickable and navigate to conversion pages
    - _Requirements: 3.4_
  
  - [x] 3.3 Integrate ConversionHistory component into dashboard
    - Add ConversionHistory component to dashboard layout
    - Position below quick action cards
    - _Requirements: 3.5_
  
  - [x] 3.4 Write unit tests for dashboard component
    - Test authentication redirect works
    - Test personalized welcome message displays
    - Test quick action cards render
    - _Requirements: 3.1, 3.6_

- [ ] 4. Create and update static pages
  - [x] 4.1 Ensure Privacy Policy page exists and is accessible
    - Verify `app/privacy/page.tsx` exists with content
    - Add SEO metadata
    - _Requirements: 4.1_
  
  - [x] 4.2 Ensure Terms of Service page exists and is accessible
    - Verify `app/terms/page.tsx` exists with content
    - Add SEO metadata
    - _Requirements: 4.2_
  
  - [x] 4.3 Ensure Help Center page exists and is accessible
    - Verify `app/help-center/page.tsx` exists with content
    - Add SEO metadata
    - _Requirements: 4.3_
  
  - [x] 4.4 Add footer links to static pages
    - Update footer component to include links to Privacy, Terms, Help Center
    - Ensure footer appears on all pages
    - _Requirements: 4.4, 4.5_

- [x] 5. Checkpoint - Verify Phase 1 completion
  - Ensure all tests pass, verify navigation works correctly, confirm all pages render properly. Ask the user if questions arise.

### Phase 2: Database and Storage Integration

- [ ] 6. Database schema updates
  - [x] 6.1 Add status field to files table
    - Create migration to add status column with 'active' and 'deleted' values
    - Add default value 'active'
    - Create indexes on status and created_at columns
    - Run migration in Supabase
    - _Requirements: 5.2, 6.4_
  
  - [x] 6.2 Create rate_limits table (optional for persistent rate limiting)
    - Create migration for rate_limits table with identifier, endpoint, request_count, window_start
    - Add indexes on identifier and window_start
    - Run migration in Supabase
    - _Requirements: 8.6_

- [ ] 7. Supabase Storage setup
  - [x] 7.1 Create storage buckets
    - Create 'uploads' bucket for input files (private, 50MB limit)
    - Create 'converted' bucket for output files (private, 100MB limit)
    - Configure allowed MIME types for each bucket
    - _Requirements: 6.2, 6.3_
  
  - [~] 7.2 Configure storage policies
    - Create policy for users to upload their own files to 'uploads' bucket
    - Create policy for users to read their own files from 'uploads' bucket
    - Create policy for users to read their converted files from 'converted' bucket
    - Create policy for service to write converted files
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Create storage utility functions
  - [~] 8.1 Implement file upload function
    - Create `src/lib/storage/operations.ts` with uploadFile function
    - Handle file upload to specified bucket and path
    - Return storage path or error
    - _Requirements: 6.1, 6.2_
  
  - [~] 8.2 Implement file deletion function
    - Add deleteFile function to storage operations
    - Handle file deletion from specified bucket and path
    - Return success status or error
    - _Requirements: 10.2, 10.4_
  
  - [~] 8.3 Implement signed URL generator
    - Create `src/lib/storage/signedUrls.ts` with generateSignedUrl function
    - Generate time-limited URLs with 1-hour expiration
    - Support both uploads and converted buckets
    - Handle errors for missing files
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 8.4 Write unit tests for storage utilities
    - Test uploadFile handles success and errors
    - Test deleteFile handles success and errors
    - Test generateSignedUrl creates valid URLs
    - _Requirements: 6.1, 7.1, 10.2_

- [ ] 9. Create database utility functions
  - [~] 9.1 Implement file record creation
    - Create `src/lib/database/files.ts` with createFileRecord function
    - Insert file metadata into files table
    - Return file ID or error
    - _Requirements: 5.2, 6.4, 6.5_
  
  - [~] 9.2 Implement conversion record creation
    - Create `src/lib/database/conversions.ts` with createConversionRecord function
    - Insert conversion metadata with pending status
    - Return conversion ID or error
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [~] 9.3 Implement conversion status update
    - Add updateConversionStatus function to conversions module
    - Update status to completed or failed
    - Store error message for failed conversions
    - _Requirements: 5.1, 5.5_
  
  - [~] 9.4 Implement user conversions query
    - Add getUserConversions function with pagination, filtering, search
    - Join with files table to get file metadata
    - Return conversions array and total count
    - _Requirements: 12.1, 12.3, 12.5, 12.6_
  
  - [~] 9.5 Write unit tests for database utilities
    - Test createFileRecord inserts correctly
    - Test createConversionRecord creates pending record
    - Test updateConversionStatus updates status
    - Test getUserConversions returns correct data
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 10. Enhance Word to PDF API with storage integration
  - [~] 10.1 Add file upload to storage before conversion
    - Update `app/api/convert/word-to-pdf/route.ts` to upload input file to 'uploads' bucket
    - Generate unique storage path using user ID and timestamp
    - Create file record in database
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [~] 10.2 Add conversion record creation
    - Create conversion record with pending status after file upload
    - Store input file ID
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [~] 10.3 Upload converted file to storage
    - After successful conversion, upload output file to 'converted' bucket
    - Create file record for output file
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [~] 10.4 Update conversion record on completion
    - Update conversion status to completed
    - Store output file ID
    - Store completion timestamp
    - _Requirements: 5.1, 5.2_
  
  - [~] 10.5 Generate signed URL for download
    - Generate signed URL for converted file with 1-hour expiration
    - Include signed URL in API response
    - Include expiration timestamp
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 10.6 Add temporary file cleanup
    - Implement cleanup in finally block to delete temp files
    - Clean up on both success and failure
    - Log cleanup errors without failing request
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [~] 10.7 Handle unauthenticated user conversions
    - Process conversions without creating database records for unauthenticated users
    - Skip storage upload for unauthenticated users
    - Return conversion result without signed URL
    - _Requirements: 5.3_
  
  - [~] 10.8 Add error handling for storage and database failures
    - Handle file upload failures with 500 status
    - Update conversion status to failed on errors
    - Store error messages in conversion record
    - _Requirements: 5.5, 6.6_
  
  - [~] 10.9 Write integration tests for enhanced Word to PDF API
    - Test successful conversion flow with storage and database
    - Test file validation errors
    - Test storage upload failures
    - Test conversion failures update status correctly
    - Test temporary file cleanup occurs
    - Test unauthenticated user flow
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.6, 11.1, 11.2, 11.3_

- [ ] 11. Checkpoint - Verify Phase 2 completion
  - Ensure all tests pass, verify storage buckets are created, confirm database records are created correctly. Ask the user if questions arise.

### Phase 3: Rate Limiting

- [ ] 12. Implement rate limiting middleware
  - [~] 12.1 Create rate limit tracking logic
    - Create `src/lib/middleware/rateLimit.ts` with in-memory Map for tracking
    - Implement request counting per user ID or IP address
    - Implement time window reset logic (60 minutes)
    - _Requirements: 8.1, 8.6_
  
  - [~] 12.2 Implement rate limit enforcement
    - Check request count against limits (10 for authenticated, 3 for unauthenticated)
    - Return 429 status when limit exceeded
    - Include retry-after time in response
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [~] 12.3 Integrate middleware with conversion API
    - Apply rate limit middleware to /api/convert/word-to-pdf endpoint
    - Ensure middleware runs before conversion processing
    - _Requirements: 8.5_
  
  - [~] 12.4 Write unit tests for rate limiting logic
    - Test request counting works correctly
    - Test time window reset
    - Test authenticated vs unauthenticated limits
    - Test 429 response when limit exceeded
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

- [ ] 13. Create quota API endpoint
  - [~] 13.1 Implement GET /api/quota endpoint
    - Create `app/api/quota/route.ts` to return user's rate limit status
    - Return limit, used, remaining, and resetAt
    - Require authentication
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [~] 13.2 Write integration tests for quota endpoint
    - Test authenticated user gets quota information
    - Test unauthenticated user gets 401
    - Test quota updates after conversions
    - _Requirements: 9.1, 9.2, 9.4_

- [ ] 14. Add quota display to dashboard
  - [~] 14.1 Fetch and display quota information
    - Update `app/dashboard/page.tsx` to fetch quota from API
    - Display current conversion count and remaining conversions
    - Show only for authenticated users
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [~] 14.2 Update quota display after conversions
    - Refresh quota information after user performs conversion
    - Update display in real-time
    - _Requirements: 9.3_
  
  - [~] 14.3 Display rate limit message when quota exceeded
    - Show message indicating when quota will reset
    - Disable conversion buttons when limit reached
    - _Requirements: 9.5_
  
  - [~] 14.4 Write unit tests for quota display
    - Test quota information renders correctly
    - Test quota updates after conversion
    - Test rate limit message displays when exceeded
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 15. Add rate limit error handling in UI
  - [~] 15.1 Handle 429 responses in conversion components
    - Update `src/components/converters/WordToPdfConverter.tsx` to handle 429 errors
    - Display user-friendly error message with retry time
    - Disable upload button until quota resets
    - _Requirements: 8.4_
  
  - [~] 15.2 Write unit tests for rate limit error handling
    - Test 429 error displays correct message
    - Test retry time is shown
    - Test upload button is disabled
    - _Requirements: 8.4_

- [ ] 16. Checkpoint - Verify Phase 3 completion
  - Ensure all tests pass, verify rate limiting works correctly, confirm quota display updates. Ask the user if questions arise.

### Phase 4: File Cleanup

- [ ] 17. Implement file cleanup job
  - [~] 17.1 Create file cleanup logic
    - Create `src/lib/jobs/fileCleanup.ts` with cleanup function
    - Query files table for files older than 7 days with status 'active'
    - Implement batch processing (100 files at a time)
    - _Requirements: 10.1, 10.2_
  
  - [~] 17.2 Implement file deletion and status update
    - Delete files from both 'uploads' and 'converted' buckets
    - Update file record status to 'deleted' after deletion
    - Handle deletion errors gracefully and continue processing
    - Log errors for failed deletions
    - _Requirements: 10.2, 10.3, 10.4, 10.6_
  
  - [~] 17.3 Add logging for cleanup operations
    - Log number of files processed
    - Log number of files successfully deleted
    - Log number of files with errors
    - Generate summary report
    - _Requirements: 10.5, 10.6_
  
  - [~] 17.4 Write unit tests for cleanup logic
    - Test identifies files older than retention period
    - Test handles deletion errors gracefully
    - Test logs results correctly
    - Test batch processing works
    - _Requirements: 10.1, 10.2, 10.5, 10.6_

- [ ] 18. Set up scheduled execution for cleanup job
  - [~] 18.1 Create API endpoint for cleanup job
    - Create `app/api/cron/cleanup/route.ts` to trigger cleanup job
    - Verify cron secret for security
    - Return execution summary
    - _Requirements: 10.1_
  
  - [~] 18.2 Configure Vercel Cron job
    - Add cron configuration to `vercel.json` for daily execution at 2 AM
    - Set up CRON_SECRET environment variable
    - Test cron job execution
    - _Requirements: 10.1_
  
  - [~] 18.3 Write integration tests for cleanup endpoint
    - Test cleanup endpoint deletes old files
    - Test cleanup endpoint requires valid secret
    - Test cleanup endpoint returns summary
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 19. Checkpoint - Verify Phase 4 completion
  - Ensure all tests pass, verify cleanup job runs correctly, confirm old files are deleted. Ask the user if questions arise.

### Phase 5: Conversion History

- [ ] 20. Create conversions API endpoint
  - [~] 20.1 Implement GET /api/conversions endpoint
    - Create `app/api/conversions/route.ts` to fetch user conversions
    - Require authentication
    - Support pagination with page and limit query parameters
    - Support filtering by type and status
    - Support search by filename
    - _Requirements: 12.1, 12.5, 12.6_
  
  - [~] 20.2 Join with files table for metadata
    - Join conversions with input and output file records
    - Return file names, sizes, and timestamps
    - Include conversion status and type
    - _Requirements: 12.3_
  
  - [~] 20.3 Return pagination metadata
    - Include page, limit, total, and totalPages in response
    - _Requirements: 12.5, 12.6_
  
  - [~] 20.4 Write integration tests for conversions endpoint
    - Test authenticated user gets their conversions
    - Test pagination works correctly
    - Test filtering by type and status
    - Test search by filename
    - Test unauthenticated user gets 401
    - _Requirements: 12.1, 12.3, 12.5, 12.6_

- [ ] 21. Create download endpoint for conversions
  - [~] 21.1 Implement GET /api/conversions/[id]/download endpoint
    - Create `app/api/conversions/[id]/download/route.ts` to generate fresh signed URL
    - Require authentication
    - Verify user owns the conversion
    - Check if file still exists (status is 'active')
    - _Requirements: 7.5, 12.4_
  
  - [~] 21.2 Generate and return signed URL
    - Generate signed URL with 1-hour expiration
    - Return URL and expiration timestamp
    - Return 404 if file is deleted
    - _Requirements: 7.5, 12.4_
  
  - [~] 21.3 Write integration tests for download endpoint
    - Test authenticated user can get download URL
    - Test user cannot access other users' conversions
    - Test 404 for deleted files
    - Test 401 for unauthenticated users
    - _Requirements: 7.5, 12.4_

- [ ] 22. Enhance ConversionHistory component
  - [~] 22.1 Implement data fetching from API
    - Update `src/components/dashboard/ConversionHistory.tsx` to fetch from /api/conversions
    - Implement loading state while fetching
    - Handle errors with user-friendly messages
    - _Requirements: 12.1_
  
  - [~] 22.2 Display conversion records
    - Render list of conversions with file names, types, timestamps, status
    - Order by creation date (newest first)
    - Display empty state when no conversions exist
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [~] 22.3 Implement pagination controls
    - Add pagination UI with page numbers and next/previous buttons
    - Limit to 50 records per page
    - Update URL query parameters when page changes
    - _Requirements: 12.5, 12.6_
  
  - [~] 22.4 Implement filtering and search
    - Add filter dropdown for conversion type
    - Add filter dropdown for status
    - Add search input for filename
    - Update API call when filters change
    - _Requirements: 12.1_
  
  - [~] 22.5 Add download functionality
    - Add download button for completed conversions
    - Call /api/conversions/[id]/download to get fresh signed URL
    - Trigger download when button clicked
    - Disable button for deleted files
    - _Requirements: 12.4_
  
  - [~] 22.6 Write unit tests for ConversionHistory component
    - Test empty state displays when no conversions
    - Test conversion records render correctly
    - Test pagination controls work
    - Test filtering and search update results
    - Test download button calls correct endpoint
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 23. Checkpoint - Verify Phase 5 completion
  - Ensure all tests pass, verify conversion history displays correctly, confirm download functionality works. Ask the user if questions arise.

### Phase 6: Testing and Polish

- [ ] 24. Write comprehensive unit tests
  - [~] 24.1 Write unit tests for all utility functions
    - Test storage operations (upload, delete, signed URLs)
    - Test database operations (create, update, query)
    - Test rate limiting logic
    - Test file cleanup logic
    - _Requirements: All_
  
  - [~] 24.2 Write unit tests for all React components
    - Test Navigation component
    - Test Home component
    - Test Dashboard component
    - Test ConversionHistory component
    - Test WordToPdfConverter component
    - _Requirements: All_

- [ ] 25. Write integration tests for all API endpoints
  - [~] 25.1 Write integration tests for conversion API
    - Test POST /api/convert/word-to-pdf with various scenarios
    - Test file validation, rate limiting, storage, database integration
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.6, 8.2, 8.3, 11.1, 11.2, 11.3_
  
  - [~] 25.2 Write integration tests for conversions API
    - Test GET /api/conversions with pagination, filtering, search
    - Test GET /api/conversions/[id]/download
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6_
  
  - [~] 25.3 Write integration tests for quota API
    - Test GET /api/quota returns correct information
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [~] 25.4 Write integration tests for cleanup API
    - Test cleanup job deletes old files correctly
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 26. Write end-to-end tests for critical workflows
  - [~] 26.1 Write E2E test for conversion flow
    - Test user uploads file, conversion completes, user downloads result
    - Test conversion appears in history
    - _Requirements: 5.1, 5.2, 6.1, 7.1, 12.1_
  
  - [~] 26.2 Write E2E test for dashboard flow
    - Test user logs in, dashboard displays welcome and history
    - Test quick actions navigate correctly
    - _Requirements: 3.1, 3.4, 3.5, 12.1_
  
  - [~] 26.3 Write E2E test for rate limit flow
    - Test user performs multiple conversions
    - Test quota display updates
    - Test rate limit message appears when exceeded
    - _Requirements: 8.2, 8.3, 9.3, 9.5_

- [ ] 27. Perform manual testing
  - [~] 27.1 Test navigation and UI
    - Verify navigation links work correctly
    - Verify home page displays tool grid
    - Verify dashboard shows personalized welcome
    - Verify static pages render correctly
    - _Requirements: 1.1, 1.5, 2.4, 3.1, 4.1, 4.2, 4.3_
  
  - [~] 27.2 Test conversion functionality
    - Verify file upload and conversion work
    - Verify download links function properly
    - Verify conversion history displays correctly
    - _Requirements: 5.1, 6.1, 7.3, 12.1, 12.3_
  
  - [~] 27.3 Test rate limiting
    - Verify rate limiting prevents excessive requests
    - Verify quota display updates in real-time
    - Verify error messages are user-friendly
    - _Requirements: 8.2, 8.3, 9.3, 9.5_
  
  - [~] 27.4 Test responsive design
    - Verify mobile responsive design works
    - Verify loading states display appropriately
    - Verify error messages are clear
    - _Requirements: All_

- [ ] 28. Fix bugs and polish UI
  - [~] 28.1 Address any bugs found during testing
    - Fix critical bugs that prevent core functionality
    - Fix UI/UX issues
    - Improve error messages
    - _Requirements: All_
  
  - [~] 28.2 Polish UI and improve user experience
    - Refine styling and layout
    - Add loading indicators where needed
    - Improve accessibility
    - _Requirements: All_

- [ ] 29. Update documentation
  - [~] 29.1 Update README with new features
    - Document navigation changes
    - Document conversion history feature
    - Document rate limiting
    - Document file cleanup
    - _Requirements: All_
  
  - [~] 29.2 Document environment variables and setup
    - Document required Supabase configuration
    - Document storage bucket setup
    - Document cron job configuration
    - _Requirements: All_

- [ ] 30. Final checkpoint - Verify all phases complete
  - Ensure all tests pass, verify all features work correctly, confirm documentation is updated. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- The implementation uses TypeScript throughout, matching the existing codebase
- All database and storage operations use Supabase client libraries
- Rate limiting uses in-memory tracking for simplicity (can be upgraded to Redis later)
- File cleanup job uses Vercel Cron for scheduling
- Testing tasks are marked optional but strongly recommended for production quality
