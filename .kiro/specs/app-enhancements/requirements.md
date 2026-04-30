# Requirements Document

## Introduction

This document specifies the requirements for enhancing the FluxConvert application with improved navigation, landing page redesign, conversion history tracking, rate limiting, and automated file cleanup. The enhancements focus on improving user experience, implementing backend data persistence, and ensuring system reliability and resource management.

## Glossary

- **Navigation_Bar**: The top navigation component containing the FluxConvert logo, menu links, and user authentication controls
- **Home_Page**: The landing page displayed at the root URL (/) that serves as the primary entry point for users
- **Dashboard_Page**: The authenticated user's personal page displaying conversion history and quick actions
- **Conversion_History**: A chronological record of file conversions performed by a user, stored in the database
- **Word_to_PDF_API**: The API endpoint at /api/convert/word-to-pdf that handles document conversion requests
- **Supabase_Storage**: The cloud storage service used to store uploaded and converted files
- **Rate_Limiter**: Middleware that tracks and restricts the number of conversion requests per user within a time window
- **File_Cleanup_Job**: An automated background process that removes expired files from storage
- **Conversion_Record**: A database entry containing metadata about a single conversion operation
- **Signed_URL**: A time-limited URL that grants temporary access to a file in Supabase Storage
- **Static_Pages**: The Privacy Policy, Terms of Service, and Help Center pages

## Requirements

### Requirement 1: Navigation Restructuring

**User Story:** As a user, I want to access the dashboard from the navigation bar, so that I can quickly view my conversion history from any page.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL display a "Dashboard" menu item that links to /dashboard
2. THE Navigation_Bar SHALL NOT display "Developer API" menu item
3. THE Navigation_Bar SHALL NOT display "Pricing" menu item
4. THE Navigation_Bar SHALL display links to Privacy Policy, Terms of Service, and Help Center pages
5. WHEN a user clicks the Dashboard menu item, THE Application SHALL navigate to /dashboard
6. THE Navigation_Bar SHALL maintain consistent styling and layout across all pages

### Requirement 2: Home Page Redesign

**User Story:** As a visitor, I want to see a welcoming landing page, so that I understand the application's purpose and can easily start using it.

#### Acceptance Criteria

1. THE Home_Page SHALL display a welcome message and application description
2. THE Home_Page SHALL NOT display a file drop zone
3. THE Home_Page SHALL NOT display file upload instructions
4. THE Home_Page SHALL display a grid of available conversion tools
5. THE Home_Page SHALL provide navigation links to specific conversion pages
6. THE Home_Page SHALL present the application as a landing page rather than a conversion tool

### Requirement 3: Dashboard Page Redesign

**User Story:** As an authenticated user, I want to see a personalized welcome on my dashboard, so that I have a better user experience.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display a personalized welcome message
2. THE Dashboard_Page SHALL NOT display a file drop zone
3. THE Dashboard_Page SHALL NOT display file upload instructions
4. THE Dashboard_Page SHALL display quick action cards for conversion tools
5. THE Dashboard_Page SHALL display the Conversion_History component
6. WHEN an unauthenticated user accesses /dashboard, THE Application SHALL redirect to /login

### Requirement 4: Static Page Integration

**User Story:** As a user, I want to access Privacy Policy, Terms of Service, and Help Center pages, so that I can understand the application's policies and get help.

#### Acceptance Criteria

1. WHEN a user navigates to /privacy, THE Application SHALL display the Privacy Policy page
2. WHEN a user navigates to /terms, THE Application SHALL display the Terms of Service page
3. WHEN a user navigates to /help-center, THE Application SHALL display the Help Center page
4. THE Navigation_Bar SHALL include links to all Static_Pages
5. THE Static_Pages SHALL be accessible from the footer on all pages

### Requirement 5: Conversion History Database Integration

**User Story:** As an authenticated user, I want my conversion history to be saved, so that I can access my converted files later.

#### Acceptance Criteria

1. WHEN the Word_to_PDF_API completes a conversion, THE Word_to_PDF_API SHALL create a Conversion_Record in the database
2. THE Conversion_Record SHALL include user_id, input file metadata, output file metadata, conversion type, status, and timestamps
3. WHEN an unauthenticated user performs a conversion, THE Word_to_PDF_API SHALL process the conversion without creating a Conversion_Record
4. THE Conversion_Record SHALL reference both input_file_id and output_file_id from the files table
5. WHEN a conversion fails, THE Word_to_PDF_API SHALL update the Conversion_Record status to 'failed' and store the error message

### Requirement 6: File Upload to Supabase Storage

**User Story:** As a user, I want my files to be securely stored, so that I can download them later.

#### Acceptance Criteria

1. WHEN a user uploads a file for conversion, THE Word_to_PDF_API SHALL upload the file to Supabase_Storage
2. THE Word_to_PDF_API SHALL store uploaded files in the 'uploads' bucket
3. THE Word_to_PDF_API SHALL store converted files in the 'converted' bucket
4. WHEN a file upload succeeds, THE Word_to_PDF_API SHALL create a file record in the files table
5. THE file record SHALL include file_name, file_type, file_size, storage_path, storage_bucket, and user_id
6. WHEN a file upload fails, THE Word_to_PDF_API SHALL return an error response with status code 500

### Requirement 7: Signed URL Generation

**User Story:** As a user, I want to download my converted files securely, so that only I can access my files.

#### Acceptance Criteria

1. WHEN a conversion completes, THE Word_to_PDF_API SHALL generate a Signed_URL for the converted file
2. THE Signed_URL SHALL expire after 3600 seconds (1 hour)
3. THE Word_to_PDF_API SHALL return the Signed_URL in the API response
4. WHEN a user clicks the download button, THE Application SHALL use the Signed_URL to download the file
5. WHEN a Signed_URL expires, THE Application SHALL generate a new Signed_URL upon user request

### Requirement 8: Rate Limiting Middleware

**User Story:** As a system administrator, I want to limit conversion requests per user, so that the system remains available for all users.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL track the number of conversion requests per user within a 60-minute time window
2. WHEN an authenticated user exceeds 10 conversions per hour, THE Rate_Limiter SHALL reject the request with status code 429
3. WHEN an unauthenticated user exceeds 3 conversions per hour per IP address, THE Rate_Limiter SHALL reject the request with status code 429
4. THE Rate_Limiter SHALL return a response indicating the time until the limit resets
5. THE Rate_Limiter SHALL apply to all conversion API endpoints
6. THE Rate_Limiter SHALL store rate limit data in memory or a fast cache

### Requirement 9: Conversion Quota Tracking

**User Story:** As a user, I want to see my remaining conversion quota, so that I know how many conversions I have left.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display the user's current conversion count for the current hour
2. THE Dashboard_Page SHALL display the user's remaining conversions before hitting the rate limit
3. WHEN a user performs a conversion, THE Application SHALL update the displayed quota in real-time
4. THE Application SHALL display quota information only for authenticated users
5. WHEN a user reaches the rate limit, THE Application SHALL display a message indicating when the quota will reset

### Requirement 10: Automated File Cleanup

**User Story:** As a system administrator, I want old files to be automatically deleted, so that storage costs remain manageable.

#### Acceptance Criteria

1. THE File_Cleanup_Job SHALL run every 24 hours
2. WHEN the File_Cleanup_Job runs, THE File_Cleanup_Job SHALL delete files older than 7 days from Supabase_Storage
3. WHEN a file is deleted from storage, THE File_Cleanup_Job SHALL update the corresponding file record status to 'deleted'
4. THE File_Cleanup_Job SHALL delete files from both 'uploads' and 'converted' buckets
5. THE File_Cleanup_Job SHALL log the number of files deleted in each execution
6. WHEN a file deletion fails, THE File_Cleanup_Job SHALL log the error and continue processing remaining files

### Requirement 11: Temporary File Cleanup

**User Story:** As a system administrator, I want temporary files to be cleaned up immediately after conversion, so that disk space is not wasted.

#### Acceptance Criteria

1. WHEN the Word_to_PDF_API creates temporary files during conversion, THE Word_to_PDF_API SHALL delete them after the conversion completes
2. WHEN a conversion fails, THE Word_to_PDF_API SHALL delete any temporary files created during the failed conversion
3. THE Word_to_PDF_API SHALL delete temporary files regardless of conversion success or failure
4. THE Word_to_PDF_API SHALL log any errors encountered during temporary file cleanup
5. WHEN temporary file cleanup fails, THE Word_to_PDF_API SHALL not fail the conversion request

### Requirement 12: Conversion History Display

**User Story:** As an authenticated user, I want to view my conversion history, so that I can track my past conversions and download previous files.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display a list of the user's Conversion_Records ordered by creation date (newest first)
2. WHEN a user has no conversion history, THE Dashboard_Page SHALL display a message indicating no conversions have been performed
3. THE Conversion_History component SHALL display file names, conversion types, timestamps, and status for each conversion
4. WHEN a user clicks on a conversion record, THE Application SHALL provide a download link if the file still exists
5. THE Conversion_History component SHALL display a maximum of 50 records per page
6. THE Conversion_History component SHALL provide pagination controls when more than 50 records exist

