import { createClient } from '@/src/lib/supabase/server';

/**
 * File record data for creating a new file entry in the database
 */
export interface FileRecordData {
  user_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_bucket: string;
}

/**
 * Create a file record in the database
 * 
 * @param data - File metadata including user_id, file_name, file_type, file_size, storage_path, storage_bucket
 * @returns Object containing the file ID on success or error on failure
 * 
 * @example
 * ```typescript
 * const result = await createFileRecord({
 *   user_id: 'user-uuid',
 *   file_name: 'document.docx',
 *   file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 *   file_size: 1024000,
 *   storage_path: 'user-uuid/1234567890-document.docx',
 *   storage_bucket: 'uploads'
 * });
 * 
 * if (result.error) {
 *   console.error('Failed to create file record:', result.error);
 * } else {
 *   console.log('File record created with ID:', result.id);
 * }
 * ```
 */
export async function createFileRecord(
  data: FileRecordData
): Promise<{ id: string; error?: Error }> {
  try {
    const supabase = await createClient();

    // Validate required fields
    if (!data.file_name || !data.file_type || !data.storage_path || !data.storage_bucket) {
      return {
        id: '',
        error: new Error('Missing required fields: file_name, file_type, storage_path, and storage_bucket are required'),
      };
    }

    // Validate file_size is a positive number
    if (typeof data.file_size !== 'number' || data.file_size < 0) {
      return {
        id: '',
        error: new Error('Invalid file_size: must be a non-negative number'),
      };
    }

    // Insert file record into database
    const { data: fileRecord, error } = await supabase
      .from('files')
      .insert({
        user_id: data.user_id,
        file_name: data.file_name,
        file_type: data.file_type,
        file_size: data.file_size,
        storage_path: data.storage_path,
        storage_bucket: data.storage_bucket,
        status: 'active', // Default status
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error creating file record:', error);
      return {
        id: '',
        error: new Error(`Failed to create file record: ${error.message}`),
      };
    }

    if (!fileRecord || !fileRecord.id) {
      return {
        id: '',
        error: new Error('Failed to create file record: No ID returned'),
      };
    }

    return {
      id: fileRecord.id,
    };
  } catch (error) {
    console.error('Unexpected error creating file record:', error);
    return {
      id: '',
      error: error instanceof Error ? error : new Error('Unknown error creating file record'),
    };
  }
}
