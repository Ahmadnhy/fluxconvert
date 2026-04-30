# Requirements Document: FluxConvert Enhancements

## Introduction

This document specifies the requirements for major enhancements to the FluxConvert application, a Next.js-based file conversion platform. The enhancements include UI/UX improvements, database integration for conversion tracking, five additional file converters, rate limiting functionality, and an automated file cleanup system. These improvements will transform FluxConvert from a basic conversion tool into a comprehensive document management platform with user tracking, quota management, and secure file storage.

## Glossary

- **FluxConvert_System**: The complete Next.js application including frontend, API routes, and database integration
- **Conversion_Engine**: The backend service responsible for file format transformations
- **Supabase_Storage**: The cloud storage service for uploaded and converted files
- **Conversion_Record**: A database entry tracking a single file conversion operation
- **User_Profile**: A database record containing user account information and preferences
- **Rate_Limiter**: The middleware component that enforces conversion quotas
- **File_Cleanup_Service**: The scheduled task that removes expired files from storage
- **Signed_URL**: A time-limited, secure URL for downloading files from storage
- **Free_User**: A user account with a daily conversion quota of 10 conversions
- **Pro_User**: A user account with unlimited daily conversions
- **Conversion_Quota**: The maximum number of conversions allowed per user per day
- **Navigation_Bar**: The top horizontal menu component visible on all pages
- **Dashboard_Page**: The authenticated user's home page showing conversion history and quick actions
- **Landing_Page**: The public home page with hero section and tool showcase
- **Conversion_History**: A list of past conversions displayed on the dashboard

## Requirements

### Requirement 1: Navigation Bar Restructuring

**User Story:** As a logged-in user, I want to see the Dashboard menu item in the navigation bar, so that I can quickly access my conversion history and account information.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE Navigation_Bar SHALL display a "Dashboard" menu item
2. WHEN a user clicks the Dashboard menu item, THE FluxConvert_System SHALL navigate to the Dashboard_Page
3. THE Navigation_Bar SHALL NOT display "Developer API" menu items on any page
4. THE Navigation_Bar SHALL NOT display "Pricing" menu items on any page
5. WHEN a user is not authenticated, THE Navigation_Bar SHALL NOT display the Dashboard menu item
6. THE Navigation_Bar SHALL maintain consistent styling across all pages
7. THE Navigation_Bar SHALL display the Dashboard menu item between the logo and converter tool links

### Requirement 2: Landing Page Transformation

**User Story:** As a visitor, I want to see a professional landing page with a hero section, so that I understand the value proposition before using the conversion tools.

#### Acceptance Criteria

1. THE Landing_Page SHALL NOT display a file drop box in the hero section
2. THE Landing_Page SHALL display a hero section with a headline describing the service
3. THE Landing_Page SHALL display a hero section with a subheadline explaining key benefits
4. THE Landing_Page SHALL display a call-to-action button in the hero section
5. WHEN a user clicks the hero call-to-action button, THE FluxConvert_System SHALL navigate to a converter tool page
6. THE Landing_Page SHALL display a grid of available conversion tools below the hero section
7. THE Landing_Page SHALL display feature highlights explaining security, speed, and quality
8. FOR ALL tool cards on the Landing_Page, clicking a card SHALL navigate to the corresponding converter page

### Requirement 3: Dashboard Page Simplification

**User Story:** As a logged-in user, I want to see a clean dashboard with my conversion history and quick actions, so that I can efficiently manage my conversions without clutter.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL NOT display a file drop box
2. THE Dashboard_Page SHALL display a welcome message with the user's email address
3. THE Dashboard_Page SHALL display a grid of quick action cards for available converters
4. WHEN a user clicks a quick action card, THE FluxConvert_System SHALL navigate to the corresponding converter page
5. THE Dashboard_Page SHALL display the Conversion_History component
6. THE Dashboard_Page SHALL display the user's remaining conversion quota
7. WHEN a Free_User has zero remaining conversions, THE Dashboard_Page SHALL display an upgrade prompt

### Requirement 4: Static Page Integration

**User Story:** As a user, I want to access Privacy Policy, Terms of Service, and Help Center pages from the navigation, so that I can understand the service policies and get help when needed.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL display links to Privacy Policy, Terms of Service, and Help Center pages
2. WHEN a user clicks the Privacy Policy link, THE FluxConvert_System SHALL navigate to /privacy
3. WHEN a user clicks the Terms of Service link, THE FluxConvert_System SHALL navigate to /terms
4. WHEN a user clicks the Help Center link, THE FluxConvert_System SHALL navigate to /help-center
5. THE FluxConvert_System SHALL render the Privacy Policy page using the existing Next.js component
6. THE FluxConvert_System SHALL render the Terms of Service page using the existing Next.js component
7. THE FluxConvert_System SHALL render the Help Center page using the existing Next.js component

### Requirement 5: Conversion Database Integration

**User Story:** As a logged-in user, I want my conversions to be saved to the database, so that I can access my conversion history and download files later.

#### Acceptance Criteria

1. WHEN a Word to PDF conversion starts, THE Conversion_Engine SHALL create a Conversion_Record with status "pending"
2. WHEN a conversion completes successfully, THE Conversion_Engine SHALL update the Conversion_Record status to "completed"
3. WHEN a conversion fails, THE Conversion_Engine SHALL update the Conversion_Record status to "failed" and store the error message
4. THE Conversion_Record SHALL include the user_id of the authenticated user
5. THE Conversion_Record SHALL include the conversion_type identifier
6. THE Conversion_Record SHALL include timestamps for created_at and completed_at
7. WHEN a user is not authenticated, THE Conversion_Engine SHALL process the conversion without creating a Conversion_Record
8. THE Conversion_Engine SHALL associate input_file_id and output_file_id with the Conversion_Record

### Requirement 6: File Storage Integration

**User Story:** As a logged-in user, I want my uploaded and converted files to be stored securely in the cloud, so that I can download them later from any device.

#### Acceptance Criteria

1. WHEN a user uploads a file for conversion, THE Conversion_Engine SHALL upload the original file to Supabase_Storage in the "uploads" bucket
2. WHEN a conversion completes, THE Conversion_Engine SHALL upload the converted file to Supabase_Storage in the "converted" bucket
3. THE Conversion_Engine SHALL create a file record in the files table for the uploaded file
4. THE Conversion_Engine SHALL create a file record in the files table for the converted file
5. THE file record SHALL include file_name, file_type, file_size, storage_path, and storage_bucket
6. THE Conversion_Engine SHALL store files in user-specific folders using the pattern "{user_id}/{timestamp}_{filename}"
7. WHEN a file upload fails, THE Conversion_Engine SHALL return an error and not create a Conversion_Record
8. THE Conversion_Engine SHALL validate file size before uploading to Supabase_Storage

### Requirement 7: Secure File Download

**User Story:** As a logged-in user, I want to download my converted files using secure URLs, so that my files remain private and protected.

#### Acceptance Criteria

1. WHEN a conversion completes, THE Conversion_Engine SHALL generate a Signed_URL for the converted file
2. THE Signed_URL SHALL expire after 24 hours
3. WHEN a user requests a file download from Conversion_History, THE FluxConvert_System SHALL generate a new Signed_URL
4. THE FluxConvert_System SHALL NOT allow users to access files belonging to other users
5. WHEN a Signed_URL expires, THE FluxConvert_System SHALL return an error and prompt the user to generate a new download link
6. THE Conversion_Engine SHALL return the Signed_URL in the API response after successful conversion
7. WHEN a user clicks the download button, THE FluxConvert_System SHALL initiate a file download using the Signed_URL

### Requirement 8: Conversion History Display

**User Story:** As a logged-in user, I want to see a list of my past conversions on the dashboard, so that I can track my conversion activity and re-download files.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display the 20 most recent Conversion_Records for the authenticated user
2. THE Conversion_History SHALL display conversions in reverse chronological order (newest first)
3. FOR EACH Conversion_Record, THE Conversion_History SHALL display the conversion type, file names, status, and timestamp
4. WHEN a conversion status is "completed", THE Conversion_History SHALL display a download button
5. WHEN a user clicks the download button, THE FluxConvert_System SHALL generate a Signed_URL and initiate the download
6. WHEN a conversion status is "failed", THE Conversion_History SHALL display the error message
7. WHEN a conversion status is "processing", THE Conversion_History SHALL display a loading indicator
8. WHEN a user has no conversions, THE Conversion_History SHALL display an empty state message

### Requirement 9: PDF to Word Converter

**User Story:** As a user, I want to convert PDF files to Word documents, so that I can edit the content in Microsoft Word.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL provide a /pdf-to-word page with a file upload interface
2. THE Conversion_Engine SHALL accept PDF files up to 50 MB
3. WHEN a user uploads a PDF file, THE Conversion_Engine SHALL convert it to DOCX format
4. THE Conversion_Engine SHALL extract text, formatting, and images from the PDF
5. WHEN the conversion completes, THE FluxConvert_System SHALL provide a download link for the DOCX file
6. WHEN a user uploads an invalid PDF file, THE Conversion_Engine SHALL return a descriptive error message
7. WHEN a logged-in user converts a file, THE Conversion_Engine SHALL save the Conversion_Record to the database
8. THE Conversion_Engine SHALL upload both input and output files to Supabase_Storage for authenticated users

### Requirement 10: JPG to PDF Converter

**User Story:** As a user, I want to convert JPG images to PDF format, so that I can create PDF documents from my photos.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL provide a /jpg-to-pdf page with a file upload interface
2. THE Conversion_Engine SHALL accept JPG files up to 50 MB
3. THE Conversion_Engine SHALL accept multiple JPG files in a single conversion request
4. WHEN a user uploads JPG files, THE Conversion_Engine SHALL create a single PDF containing all images
5. THE Conversion_Engine SHALL preserve image quality and aspect ratio in the PDF
6. WHEN the conversion completes, THE FluxConvert_System SHALL provide a download link for the PDF file
7. WHEN a user uploads an invalid image file, THE Conversion_Engine SHALL return a descriptive error message
8. WHEN a logged-in user converts files, THE Conversion_Engine SHALL save the Conversion_Record to the database

### Requirement 11: PDF to JPG Converter

**User Story:** As a user, I want to convert PDF pages to JPG images, so that I can use the pages as image files.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL provide a /pdf-to-jpg page with a file upload interface
2. THE Conversion_Engine SHALL accept PDF files up to 50 MB
3. WHEN a user uploads a PDF file, THE Conversion_Engine SHALL convert each page to a separate JPG image
4. THE Conversion_Engine SHALL render PDF pages at 300 DPI resolution
5. WHEN the conversion completes, THE FluxConvert_System SHALL provide download links for all JPG files
6. THE FluxConvert_System SHALL package multiple JPG files into a ZIP archive for download
7. WHEN a user uploads an invalid PDF file, THE Conversion_Engine SHALL return a descriptive error message
8. WHEN a logged-in user converts a file, THE Conversion_Engine SHALL save the Conversion_Record to the database

### Requirement 12: Merge PDF Converter

**User Story:** As a user, I want to combine multiple PDF files into one document, so that I can consolidate related documents.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL provide a /merge-pdf page with a multi-file upload interface
2. THE Conversion_Engine SHALL accept multiple PDF files with a combined size up to 100 MB
3. WHEN a user uploads multiple PDF files, THE Conversion_Engine SHALL merge them in the order specified by the user
4. THE Conversion_Engine SHALL preserve all pages, formatting, and metadata from the source PDFs
5. WHEN the conversion completes, THE FluxConvert_System SHALL provide a download link for the merged PDF
6. THE FluxConvert_System SHALL allow users to reorder PDF files before merging
7. WHEN a user uploads an invalid PDF file, THE Conversion_Engine SHALL return a descriptive error message
8. WHEN a logged-in user merges files, THE Conversion_Engine SHALL save the Conversion_Record to the database

### Requirement 13: Split PDF Converter

**User Story:** As a user, I want to extract specific pages from a PDF file, so that I can create smaller documents from large PDFs.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL provide a /split-pdf page with a file upload interface
2. THE Conversion_Engine SHALL accept PDF files up to 50 MB
3. WHEN a user uploads a PDF file, THE FluxConvert_System SHALL display a page selector interface
4. THE FluxConvert_System SHALL allow users to specify page ranges for extraction (e.g., "1-3, 5, 7-10")
5. WHEN a user submits page ranges, THE Conversion_Engine SHALL extract the specified pages into a new PDF
6. THE Conversion_Engine SHALL preserve formatting and metadata from the source PDF
7. WHEN the conversion completes, THE FluxConvert_System SHALL provide a download link for the extracted PDF
8. WHEN a logged-in user splits a file, THE Conversion_Engine SHALL save the Conversion_Record to the database

### Requirement 14: Rate Limiting Middleware

**User Story:** As a system administrator, I want to enforce conversion quotas based on user account type, so that I can manage system resources and encourage upgrades to Pro accounts.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL track the number of conversions per user per day
2. WHEN a Free_User attempts a conversion, THE Rate_Limiter SHALL check if they have remaining quota
3. WHEN a Free_User has zero remaining quota, THE Rate_Limiter SHALL reject the conversion request with a quota exceeded error
4. WHEN a Pro_User attempts a conversion, THE Rate_Limiter SHALL allow the conversion without quota checks
5. THE Rate_Limiter SHALL reset Free_User quotas at midnight UTC each day
6. THE Rate_Limiter SHALL store quota usage in the database for persistence across server restarts
7. WHEN an unauthenticated user attempts a conversion, THE Rate_Limiter SHALL allow the conversion without quota tracking
8. THE Rate_Limiter SHALL return the remaining quota count in API responses

### Requirement 15: Quota Display

**User Story:** As a Free_User, I want to see my remaining conversion quota on the dashboard, so that I know how many conversions I have left today.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display the user's remaining Conversion_Quota
2. THE Dashboard_Page SHALL display the total daily quota for the user's account type
3. THE Dashboard_Page SHALL display the quota in the format "X of Y conversions remaining today"
4. WHEN a Free_User has used all conversions, THE Dashboard_Page SHALL display "0 of 10 conversions remaining today"
5. WHEN a Pro_User views the dashboard, THE Dashboard_Page SHALL display "Unlimited conversions"
6. THE Dashboard_Page SHALL update the quota display after each conversion
7. THE Dashboard_Page SHALL display the time until quota reset (e.g., "Resets in 8 hours")

### Requirement 16: Quota Exceeded Error Handling

**User Story:** As a Free_User, I want to see a clear error message when I exceed my daily quota, so that I understand why my conversion was rejected and what options I have.

#### Acceptance Criteria

1. WHEN a Free_User exceeds their quota, THE FluxConvert_System SHALL display an error message "Daily conversion limit reached"
2. THE error message SHALL include the quota reset time
3. THE error message SHALL include a link to upgrade to a Pro account
4. THE FluxConvert_System SHALL NOT process the conversion when quota is exceeded
5. THE FluxConvert_System SHALL return a 429 HTTP status code for quota exceeded errors
6. THE error message SHALL be displayed prominently on the converter page
7. WHEN a user clicks the upgrade link, THE FluxConvert_System SHALL navigate to the pricing page

### Requirement 17: File Expiry System

**User Story:** As a system administrator, I want files to automatically expire after 24 hours, so that storage costs remain manageable and user privacy is protected.

#### Acceptance Criteria

1. THE File_Cleanup_Service SHALL identify files older than 24 hours
2. THE File_Cleanup_Service SHALL delete expired files from Supabase_Storage
3. THE File_Cleanup_Service SHALL update the corresponding file records in the database to mark them as deleted
4. THE File_Cleanup_Service SHALL run automatically every hour
5. WHEN a file is deleted, THE File_Cleanup_Service SHALL log the deletion for audit purposes
6. THE File_Cleanup_Service SHALL handle deletion errors gracefully without stopping the cleanup process
7. WHEN a user attempts to download an expired file, THE FluxConvert_System SHALL display a "File expired" error message

### Requirement 18: Scheduled File Cleanup

**User Story:** As a system administrator, I want a scheduled task to clean up expired files automatically, so that I don't need to manually manage storage.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL implement a cron job or scheduled task for file cleanup
2. THE File_Cleanup_Service SHALL run every hour
3. THE File_Cleanup_Service SHALL process cleanup in batches to avoid memory issues
4. THE File_Cleanup_Service SHALL delete files from both "uploads" and "converted" buckets
5. THE File_Cleanup_Service SHALL log the number of files deleted in each run
6. WHEN the cleanup task fails, THE File_Cleanup_Service SHALL log the error and retry on the next scheduled run
7. THE File_Cleanup_Service SHALL not delete files that are currently being processed

### Requirement 19: Temporary File Cleanup

**User Story:** As a system administrator, I want temporary files to be cleaned up immediately after conversion, so that disk space is freed quickly.

#### Acceptance Criteria

1. WHEN a conversion completes successfully, THE Conversion_Engine SHALL delete temporary files from the server
2. WHEN a conversion fails, THE Conversion_Engine SHALL delete temporary files from the server
3. THE Conversion_Engine SHALL delete temporary files within 5 minutes of conversion completion
4. THE Conversion_Engine SHALL log any errors encountered during temporary file cleanup
5. THE Conversion_Engine SHALL not fail the conversion if temporary file cleanup fails
6. THE Conversion_Engine SHALL clean up files from the "temp" bucket in Supabase_Storage
7. THE Conversion_Engine SHALL use unique temporary file names to avoid conflicts

### Requirement 20: Manual File Deletion

**User Story:** As a logged-in user, I want to manually delete files from my conversion history, so that I can remove sensitive documents before the 24-hour expiry.

#### Acceptance Criteria

1. THE Conversion_History SHALL display a delete button for each completed conversion
2. WHEN a user clicks the delete button, THE FluxConvert_System SHALL prompt for confirmation
3. WHEN a user confirms deletion, THE FluxConvert_System SHALL delete the files from Supabase_Storage
4. THE FluxConvert_System SHALL update the Conversion_Record to mark files as deleted
5. THE FluxConvert_System SHALL remove the conversion from the Conversion_History display
6. WHEN file deletion fails, THE FluxConvert_System SHALL display an error message
7. THE FluxConvert_System SHALL only allow users to delete their own files

### Requirement 21: Converter Page Consistency

**User Story:** As a user, I want all converter pages to have a consistent layout and user experience, so that I can easily switch between different conversion tools.

#### Acceptance Criteria

1. THE FluxConvert_System SHALL use a consistent page layout for all converter pages
2. THE FluxConvert_System SHALL use consistent file upload UI components across all converters
3. THE FluxConvert_System SHALL display consistent progress indicators during conversion
4. THE FluxConvert_System SHALL use consistent error message styling across all converters
5. THE FluxConvert_System SHALL display consistent success messages and download buttons
6. THE FluxConvert_System SHALL use the same color scheme and typography across all converter pages
7. THE FluxConvert_System SHALL display the same navigation bar on all converter pages

### Requirement 22: Error Recovery

**User Story:** As a user, I want clear error messages and recovery options when conversions fail, so that I can understand what went wrong and try again.

#### Acceptance Criteria

1. WHEN a conversion fails due to invalid file format, THE FluxConvert_System SHALL display "Invalid file format. Please upload a valid [format] file."
2. WHEN a conversion fails due to file size, THE FluxConvert_System SHALL display "File size exceeds [limit] MB limit."
3. WHEN a conversion fails due to corrupted file, THE FluxConvert_System SHALL display "File appears to be corrupted. Please try a different file."
4. WHEN a conversion fails due to server error, THE FluxConvert_System SHALL display "Conversion failed. Please try again."
5. THE FluxConvert_System SHALL provide a "Try Again" button after conversion errors
6. WHEN a user clicks "Try Again", THE FluxConvert_System SHALL reset the converter to the upload state
7. THE FluxConvert_System SHALL log detailed error information for debugging purposes

### Requirement 23: User Account Type Management

**User Story:** As a system administrator, I want to manage user account types in the database, so that I can upgrade users to Pro accounts and enforce appropriate quotas.

#### Acceptance Criteria

1. THE User_Profile SHALL include an account_type field with values "free" or "pro"
2. WHEN a new user registers, THE FluxConvert_System SHALL set account_type to "free" by default
3. THE FluxConvert_System SHALL allow administrators to update user account_type in the database
4. THE Rate_Limiter SHALL read the account_type from User_Profile to determine quota limits
5. WHEN a user's account_type changes to "pro", THE Rate_Limiter SHALL immediately allow unlimited conversions
6. WHEN a user's account_type changes to "free", THE Rate_Limiter SHALL immediately enforce the 10 conversion daily limit
7. THE User_Profile SHALL include an upgraded_at timestamp for Pro accounts

### Requirement 24: Conversion Progress Tracking

**User Story:** As a user, I want to see real-time progress during file conversion, so that I know the conversion is working and approximately how long it will take.

#### Acceptance Criteria

1. WHEN a conversion starts, THE FluxConvert_System SHALL display a progress indicator
2. THE progress indicator SHALL show the current conversion stage (uploading, converting, finalizing)
3. THE progress indicator SHALL display a percentage completion estimate
4. THE FluxConvert_System SHALL update the progress indicator at least every 2 seconds
5. WHEN a conversion completes, THE progress indicator SHALL show 100% before displaying the download button
6. THE progress indicator SHALL use smooth animations for percentage updates
7. WHEN a conversion takes longer than 30 seconds, THE FluxConvert_System SHALL display a "This may take a few moments" message

### Requirement 25: File Validation

**User Story:** As a user, I want files to be validated before conversion starts, so that I receive immediate feedback about invalid files instead of waiting for conversion to fail.

#### Acceptance Criteria

1. WHEN a user selects a file, THE FluxConvert_System SHALL validate the file extension
2. WHEN a user selects a file, THE FluxConvert_System SHALL validate the file size
3. WHEN a user selects a file, THE FluxConvert_System SHALL validate the MIME type
4. WHEN validation fails, THE FluxConvert_System SHALL display an error message immediately
5. WHEN validation fails, THE FluxConvert_System SHALL not allow the user to start conversion
6. THE FluxConvert_System SHALL display supported file formats on each converter page
7. THE FluxConvert_System SHALL display the maximum file size limit on each converter page

