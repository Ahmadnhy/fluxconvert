import { createClient } from '@/src/lib/supabase/server';

/**
 * Generate a signed URL for secure file access
 * 
 * @param bucket - The storage bucket name ('uploads' or 'converted')
 * @param path - The file path within the bucket
 * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour)
 * @returns Object containing the signed URL on success or error on failure
 */
export async function generateSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string; error?: Error }> {
  try {
    const supabase = await createClient();

    // Generate signed URL with specified expiration
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`Failed to generate signed URL for ${bucket}/${path}:`, error);
      return {
        url: '',
        error: new Error(`Failed to generate signed URL: ${error.message}`),
      };
    }

    if (!data || !data.signedUrl) {
      console.error(`No signed URL returned for ${bucket}/${path}`);
      return {
        url: '',
        error: new Error('No signed URL returned from storage'),
      };
    }

    return {
      url: data.signedUrl,
    };
  } catch (error) {
    console.error(`Unexpected error generating signed URL for ${bucket}/${path}:`, error);
    return {
      url: '',
      error: error instanceof Error ? error : new Error('Unknown error generating signed URL'),
    };
  }
}
