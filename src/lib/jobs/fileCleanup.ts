import { createClient } from '@/src/lib/supabase/server';
import { deleteFile } from '@/src/lib/storage/operations';

/**
 * Result of cleaning up a single file
 */
interface FileCleanupResult {
  fileId: string;
  fileName: string;
  storagePath: string;
  storageBucket: string;
  success: boolean;
  error?: string;
}

/**
 * Summary of the cleanup operation
 */
export interface CleanupSummary {
  totalProcessed: number;
  successfullyDeleted: number;
  failed: number;
  errors: Array<{
    fileId: string;
    fileName: string;
    error: string;
  }>;
}

/**
 * Clean up old files from storage and mark them as deleted in the database
 * 
 * This function:
 * 1. Queries files older than 7 days with status 'active'
 * 2. Processes files in batches of 100
 * 3. For each file, deletes from storage and updates status to 'deleted'
 * 4. Returns a summary of the cleanup operation
 * 
 * @param retentionDays - Number of days to retain files (default: 7)
 * @param batchSize - Number of files to process in each batch (default: 100)
 * @returns Summary of the cleanup operation
 * 
 * @example
 * ```typescript
 * const summary = await cleanupOldFiles();
 * console.log(`Processed ${summary.totalProcessed} files`);
 * console.log(`Successfully deleted ${summary.successfullyDeleted} files`);
 * console.log(`Failed to delete ${summary.failed} files`);
 * ```
 */
export async function cleanupOldFiles(
  retentionDays: number = 7,
  batchSize: number = 100
): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    totalProcessed: 0,
    successfullyDeleted: 0,
    failed: 0,
    errors: [],
  };

  try {
    const supabase = await createClient();

    // Calculate the cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();

    console.log(`[File Cleanup] Starting cleanup for files older than ${cutoffISO}`);

    // Query files older than retention period with status 'active'
    // Process in batches to avoid memory issues
    let hasMoreFiles = true;
    let offset = 0;

    while (hasMoreFiles) {
      const { data: files, error: queryError } = await supabase
        .from('files')
        .select('id, file_name, storage_path, storage_bucket, created_at')
        .eq('status', 'active')
        .lt('created_at', cutoffISO)
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (queryError) {
        console.error('[File Cleanup] Error querying files:', queryError);
        summary.errors.push({
          fileId: 'N/A',
          fileName: 'N/A',
          error: `Database query error: ${queryError.message}`,
        });
        break;
      }

      if (!files || files.length === 0) {
        hasMoreFiles = false;
        break;
      }

      console.log(`[File Cleanup] Processing batch of ${files.length} files (offset: ${offset})`);

      // Process each file in the batch
      for (const file of files) {
        summary.totalProcessed++;

        const result = await cleanupSingleFile(
          supabase,
          file.id,
          file.file_name,
          file.storage_bucket,
          file.storage_path
        );

        if (result.success) {
          summary.successfullyDeleted++;
        } else {
          summary.failed++;
          summary.errors.push({
            fileId: result.fileId,
            fileName: result.fileName,
            error: result.error || 'Unknown error',
          });
        }
      }

      // If we got fewer files than the batch size, we've processed all files
      if (files.length < batchSize) {
        hasMoreFiles = false;
      } else {
        offset += batchSize;
      }
    }

    console.log('[File Cleanup] Cleanup completed');
    console.log(`[File Cleanup] Total processed: ${summary.totalProcessed}`);
    console.log(`[File Cleanup] Successfully deleted: ${summary.successfullyDeleted}`);
    console.log(`[File Cleanup] Failed: ${summary.failed}`);

    return summary;
  } catch (error) {
    console.error('[File Cleanup] Unexpected error during cleanup:', error);
    summary.errors.push({
      fileId: 'N/A',
      fileName: 'N/A',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return summary;
  }
}

/**
 * Clean up a single file: delete from storage and update database status
 * 
 * @param supabase - Supabase client instance
 * @param fileId - File ID in the database
 * @param fileName - File name for logging
 * @param storageBucket - Storage bucket name
 * @param storagePath - Storage path within the bucket
 * @returns Result of the cleanup operation
 */
async function cleanupSingleFile(
  supabase: any,
  fileId: string,
  fileName: string,
  storageBucket: string,
  storagePath: string
): Promise<FileCleanupResult> {
  try {
    // Delete file from storage
    const deleteResult = await deleteFile(storageBucket, storagePath);

    if (!deleteResult.success) {
      console.error(
        `[File Cleanup] Failed to delete file from storage: ${storageBucket}/${storagePath}`,
        deleteResult.error
      );
      return {
        fileId,
        fileName,
        storagePath,
        storageBucket,
        success: false,
        error: deleteResult.error?.message || 'Failed to delete from storage',
      };
    }

    // Update file status to 'deleted' in database
    const { error: updateError } = await supabase
      .from('files')
      .update({ status: 'deleted' })
      .eq('id', fileId);

    if (updateError) {
      console.error(
        `[File Cleanup] Failed to update file status in database: ${fileId}`,
        updateError
      );
      return {
        fileId,
        fileName,
        storagePath,
        storageBucket,
        success: false,
        error: `Failed to update database: ${updateError.message}`,
      };
    }

    console.log(`[File Cleanup] Successfully cleaned up file: ${fileName} (${fileId})`);

    return {
      fileId,
      fileName,
      storagePath,
      storageBucket,
      success: true,
    };
  } catch (error) {
    console.error(`[File Cleanup] Unexpected error cleaning up file ${fileId}:`, error);
    return {
      fileId,
      fileName,
      storagePath,
      storageBucket,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
