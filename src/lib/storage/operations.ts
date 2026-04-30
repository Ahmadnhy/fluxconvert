import { createClient } from '@/src/lib/supabase/server';

/**
 * Upload a file to Supabase Storage
 * 
 * @param bucket - The storage bucket name ('uploads' or 'converted')
 * @param path - The file path within the bucket (e.g., 'user-id/timestamp-filename.ext')
 * @param file - The file data as File, Blob, ArrayBuffer, or Buffer
 * @param options - Optional upload options
 * @returns Object containing the storage path on success or error on failure
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; error?: Error }> {
  try {
    const supabase = await createClient();

    // Convert Buffer to ArrayBuffer if needed
    let fileData: File | Blob | ArrayBuffer;
    if (Buffer.isBuffer(file)) {
      fileData = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      fileData = file;
    }

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, {
        contentType: options?.contentType,
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error(`Storage upload error for ${bucket}/${path}:`, error);
      return {
        path: '',
        error: new Error(`Failed to upload file: ${error.message}`),
      };
    }

    return {
      path: data.path,
    };
  } catch (error) {
    console.error(`Unexpected error during file upload to ${bucket}/${path}:`, error);
    return {
      path: '',
      error: error instanceof Error ? error : new Error('Unknown error during file upload'),
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param bucket - The storage bucket name ('uploads' or 'converted')
 * @param path - The file path within the bucket to delete
 * @returns Object containing success status and optional error
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    const supabase = await createClient();

    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error(`Storage deletion error for ${bucket}/${path}:`, error);
      return {
        success: false,
        error: new Error(`Failed to delete file: ${error.message}`),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Unexpected error during file deletion from ${bucket}/${path}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error during file deletion'),
    };
  }
}
