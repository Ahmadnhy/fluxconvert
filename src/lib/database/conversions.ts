import { createClient } from '@/src/lib/supabase/server';
import { createServiceClient } from '@/src/lib/supabase/service';

/**
 * Conversion record data for creating a new conversion entry in the database
 */
export interface ConversionRecordData {
  user_id: string | null;
  input_file_id: string;
  conversion_type: string;
}

/**
 * Create a conversion record in the database with pending status
 * 
 * @param data - Conversion metadata including user_id, input_file_id, conversion_type
 * @returns Object containing the conversion ID on success or error on failure
 * 
 * @example
 * ```typescript
 * const result = await createConversionRecord({
 *   user_id: 'user-uuid',
 *   input_file_id: 'file-uuid',
 *   conversion_type: 'word-to-pdf'
 * });
 * 
 * if (result.error) {
 *   console.error('Failed to create conversion record:', result.error);
 * } else {
 *   console.log('Conversion record created with ID:', result.id);
 * }
 * ```
 */
export async function createConversionRecord(
  data: ConversionRecordData
): Promise<{ id: string; error?: Error }> {
  try {
    const supabase = createServiceClient();

    // Validate required fields
    if (!data.input_file_id || !data.conversion_type) {
      return {
        id: '',
        error: new Error('Missing required fields: input_file_id and conversion_type are required'),
      };
    }

    // Validate conversion_type is not empty
    if (typeof data.conversion_type !== 'string' || data.conversion_type.trim() === '') {
      return {
        id: '',
        error: new Error('Invalid conversion_type: must be a non-empty string'),
      };
    }

    // Insert conversion record into database
    const { data: conversionRecord, error } = await supabase
      .from('conversions')
      .insert({
        user_id: data.user_id,
        input_file_id: data.input_file_id,
        output_file_id: null, // Initially null until conversion completes
        conversion_type: data.conversion_type,
        status: 'pending', // Default status
        error_message: null, // Initially null
        completed_at: null, // Initially null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error creating conversion record:', error);
      return {
        id: '',
        error: new Error(`Failed to create conversion record: ${error.message}`),
      };
    }

    if (!conversionRecord || !conversionRecord.id) {
      return {
        id: '',
        error: new Error('Failed to create conversion record: No ID returned'),
      };
    }

    return {
      id: conversionRecord.id,
    };
  } catch (error) {
    console.error('Unexpected error creating conversion record:', error);
    return {
      id: '',
      error: error instanceof Error ? error : new Error('Unknown error creating conversion record'),
    };
  }
}

/**
 * Update conversion status data for updating a conversion record
 */
export interface UpdateConversionStatusData {
  conversion_id: string;
  status: 'completed' | 'failed';
  output_file_id?: string;
  error_message?: string;
}

/**
 * Options for querying user conversions
 */
export interface GetUserConversionsOptions {
  page?: number;
  limit?: number;
  conversion_type?: string;
  status?: string;
  search?: string;
}

/**
 * File metadata for conversion records
 */
export interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_bucket: string;
  status: string;
  created_at: string;
}

/**
 * Conversion record with file metadata
 */
export interface ConversionWithFiles {
  id: string;
  user_id: string | null;
  conversion_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  input_file: FileMetadata | null;
  output_file: FileMetadata | null;
}

/**
 * Result of getUserConversions query
 */
export interface GetUserConversionsResult {
  conversions: ConversionWithFiles[];
  total: number;
  page: number;
  limit: number;
  error?: Error;
}

/**
 * Update the status of a conversion record in the database
 * 
 * @param data - Update data including conversion_id, status, output_file_id (optional), error_message (optional)
 * @returns Object containing success status or error on failure
 * 
 * @example
 * ```typescript
 * // Update to completed status
 * const result = await updateConversionStatus({
 *   conversion_id: 'conversion-uuid',
 *   status: 'completed',
 *   output_file_id: 'output-file-uuid'
 * });
 * 
 * // Update to failed status
 * const result = await updateConversionStatus({
 *   conversion_id: 'conversion-uuid',
 *   status: 'failed',
 *   error_message: 'Conversion failed due to invalid file format'
 * });
 * 
 * if (result.error) {
 *   console.error('Failed to update conversion status:', result.error);
 * } else {
 *   console.log('Conversion status updated successfully');
 * }
 * ```
 */
export async function updateConversionStatus(
  data: UpdateConversionStatusData
): Promise<{ success: boolean; error?: Error }> {
  try {
    const supabase = createServiceClient();

    // Validate required fields
    if (!data.conversion_id || !data.status) {
      return {
        success: false,
        error: new Error('Missing required fields: conversion_id and status are required'),
      };
    }

    // Validate status value
    if (data.status !== 'completed' && data.status !== 'failed') {
      return {
        success: false,
        error: new Error('Invalid status: must be either "completed" or "failed"'),
      };
    }

    // Validate conversion_id is not empty
    if (typeof data.conversion_id !== 'string' || data.conversion_id.trim() === '') {
      return {
        success: false,
        error: new Error('Invalid conversion_id: must be a non-empty string'),
      };
    }

    // Build update object
    const updateData: {
      status: 'completed' | 'failed';
      completed_at: string;
      output_file_id?: string | null;
      error_message?: string | null;
    } = {
      status: data.status,
      completed_at: new Date().toISOString(),
    };

    // Add output_file_id for completed conversions
    if (data.status === 'completed' && data.output_file_id) {
      updateData.output_file_id = data.output_file_id;
    }

    // Add error_message for failed conversions
    if (data.status === 'failed' && data.error_message) {
      updateData.error_message = data.error_message;
    }

    // Update conversion record in database
    const { error } = await supabase
      .from('conversions')
      .update(updateData)
      .eq('id', data.conversion_id);

    if (error) {
      console.error('Database error updating conversion status:', error);
      return {
        success: false,
        error: new Error(`Failed to update conversion status: ${error.message}`),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error updating conversion status:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error updating conversion status'),
    };
  }
}

/**
 * Get user's conversion history with pagination, filtering, and search
 * 
 * @param user_id - User ID to fetch conversions for
 * @param options - Query options including pagination, filtering, and search
 * @returns Object containing conversions array, total count, page, and limit
 * 
 * @example
 * ```typescript
 * // Get first page of conversions
 * const result = await getUserConversions('user-uuid', { page: 1, limit: 50 });
 * 
 * // Filter by conversion type
 * const result = await getUserConversions('user-uuid', { 
 *   page: 1, 
 *   limit: 50, 
 *   conversion_type: 'word-to-pdf' 
 * });
 * 
 * // Search by filename
 * const result = await getUserConversions('user-uuid', { 
 *   page: 1, 
 *   limit: 50, 
 *   search: 'report' 
 * });
 * 
 * if (result.error) {
 *   console.error('Failed to fetch conversions:', result.error);
 * } else {
 *   console.log(`Found ${result.total} conversions`);
 *   console.log(`Showing page ${result.page} of ${Math.ceil(result.total / result.limit)}`);
 * }
 * ```
 */
export async function getUserConversions(
  user_id: string,
  options: GetUserConversionsOptions = {}
): Promise<GetUserConversionsResult> {
  // Set defaults for pagination FIRST
  const page = options.page && options.page > 0 ? options.page : 1;
  let limit = options.limit && options.limit > 0 ? options.limit : 50;
  if (limit > 100) limit = 100; // Cap at 100
  
  try {
    const supabase = await createClient();

    // Validate user_id
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return {
        conversions: [],
        total: 0,
        page,
        limit,
        error: new Error('Invalid user_id: must be a non-empty string'),
      };
    }

    const offset = (page - 1) * limit;

    // Build query for conversions with file joins
    let query = supabase
      .from('conversions')
      .select(`
        id,
        user_id,
        conversion_type,
        status,
        error_message,
        created_at,
        completed_at,
        input_file:input_file_id (
          id,
          file_name,
          file_type,
          file_size,
          storage_path,
          storage_bucket,
          status,
          created_at
        ),
        output_file:output_file_id (
          id,
          file_name,
          file_type,
          file_size,
          storage_path,
          storage_bucket,
          status,
          created_at
        )
      `)
      .eq('user_id', user_id);

    // Apply filters
    if (options.conversion_type && options.conversion_type.trim() !== '') {
      query = query.eq('conversion_type', options.conversion_type.trim());
    }

    if (options.status && options.status.trim() !== '') {
      query = query.eq('status', options.status.trim());
    }

    // Apply search filter on input file name
    if (options.search && options.search.trim() !== '') {
      // Note: Supabase doesn't support direct filtering on joined tables in the same query
      // We'll need to fetch all and filter in memory, or use a different approach
      // For now, we'll use ilike on a text search which requires a different query structure
      // This is a limitation we'll document
    }

    // Order by created_at DESC (newest first)
    query = query.order('created_at', { ascending: false });

    // Get total count for pagination
    const countQuery = supabase
      .from('conversions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id);

    // Apply same filters to count query
    let finalCountQuery = countQuery;
    if (options.conversion_type && options.conversion_type.trim() !== '') {
      finalCountQuery = finalCountQuery.eq('conversion_type', options.conversion_type.trim());
    }
    if (options.status && options.status.trim() !== '') {
      finalCountQuery = finalCountQuery.eq('status', options.status.trim());
    }

    const { count, error: countError } = await finalCountQuery;

    if (countError) {
      console.error('Database error counting conversions:', countError);
      return {
        conversions: [],
        total: 0,
        page,
        limit,
        error: new Error(`Failed to count conversions: ${countError.message}`),
      };
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching conversions:', error);
      return {
        conversions: [],
        total: 0,
        page,
        limit,
        error: new Error(`Failed to fetch conversions: ${error.message}`),
      };
    }

    // Transform data to match interface
    let conversions: ConversionWithFiles[] = (data || []).map((record: any) => ({
      id: record.id,
      user_id: record.user_id,
      conversion_type: record.conversion_type,
      status: record.status,
      error_message: record.error_message,
      created_at: record.created_at,
      completed_at: record.completed_at,
      input_file: record.input_file,
      output_file: record.output_file,
    }));

    // Apply search filter in memory if provided
    if (options.search && options.search.trim() !== '') {
      const searchTerm = options.search.trim().toLowerCase();
      conversions = conversions.filter((conversion) => {
        const inputFileName = conversion.input_file?.file_name?.toLowerCase() || '';
        const outputFileName = conversion.output_file?.file_name?.toLowerCase() || '';
        return inputFileName.includes(searchTerm) || outputFileName.includes(searchTerm);
      });
    }

    return {
      conversions,
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Unexpected error fetching user conversions:', error);
    const page = options.page && options.page > 0 ? options.page : 1;
    let limit = options.limit && options.limit > 0 ? options.limit : 50;
    if (limit > 100) limit = 100;
    
    return {
      conversions: [],
      total: 0,
      page,
      limit,
      error: error instanceof Error ? error : new Error('Unknown error fetching user conversions'),
    };
  }
}
