import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createServiceClient } from '@/src/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/conversions/:id
 * 
 * Deletes a conversion record from the database.
 * 
 * Authorization:
 * - User must be authenticated (401 if not)
 * - User must own the conversion (403 if not)
 * 
 * Path Parameters:
 * - id: Conversion ID to delete
 * 
 * Response:
 * - success: Boolean indicating deletion success
 * - error: Error message if deletion fails
 * 
 * Requirements: 17.8, 17.9, 17.10
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Require authentication
    if (authError || !user) {
      console.log('DELETE /api/conversions/:id - Unauthorized: No authenticated user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversion ID from params
    const { id: conversionId } = await params;

    if (!conversionId || typeof conversionId !== 'string' || conversionId.trim() === '') {
      console.log('DELETE /api/conversions/:id - Invalid conversion ID');
      return NextResponse.json(
        { error: 'Invalid conversion ID' },
        { status: 400 }
      );
    }

    // Fetch conversion record to verify ownership and get associated file details
    const { data: conversion, error: fetchError } = await supabase
      .from('conversions')
      .select(`
        id,
        user_id,
        input_file_id,
        output_file_id,
        input_file:input_file_id (id, storage_path, storage_bucket),
        output_file:output_file_id (id, storage_path, storage_bucket)
      `)
      .eq('id', conversionId)
      .single();

    if (fetchError) {
      console.error('DELETE /api/conversions/:id - Database error fetching conversion:', fetchError);
      
      // Check if conversion not found
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversion not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch conversion record' },
        { status: 500 }
      );
    }

    if (!conversion) {
      console.log('DELETE /api/conversions/:id - Conversion not found:', conversionId);
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    const convRecord = conversion as any;

    // Verify user owns the conversion
    if (convRecord.user_id !== user.id) {
      console.log('DELETE /api/conversions/:id - Forbidden: User does not own conversion', {
        userId: user.id,
        conversionUserId: convRecord.user_id,
        conversionId,
      });
      return NextResponse.json(
        { error: 'Forbidden: You do not own this conversion' },
        { status: 403 }
      );
    }

    // Initialize service client to bypass RLS for secure deletion of owned assets
    const serviceClient = createServiceClient();

    // Delete conversion record from database
    const { error: deleteError } = await serviceClient
      .from('conversions')
      .delete()
      .eq('id', conversionId);

    if (deleteError) {
      console.error('DELETE /api/conversions/:id - Database error deleting conversion:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete conversion record' },
        { status: 500 }
      );
    }

    // Delete associated output file if it exists
    if (convRecord.output_file) {
      const { storage_path, storage_bucket, id: fileId } = convRecord.output_file;
      
      // Delete physical file from storage
      const { error: storageError } = await serviceClient.storage
        .from(storage_bucket)
        .remove([storage_path]);
      if (storageError) {
        console.error(`DELETE /api/conversions/:id - Failed to delete output file from storage (${storage_bucket}/${storage_path}):`, storageError);
      }

      // Delete file record from files table
      const { error: fileDeleteError } = await serviceClient
        .from('files')
        .delete()
        .eq('id', fileId);
      if (fileDeleteError) {
        console.error(`DELETE /api/conversions/:id - Failed to delete output file record from database (${fileId}):`, fileDeleteError);
      }
    }

    // Delete associated input file if it exists
    if (convRecord.input_file) {
      const { storage_path, storage_bucket, id: fileId } = convRecord.input_file;
      
      // Delete physical file from storage
      const { error: storageError } = await serviceClient.storage
        .from(storage_bucket)
        .remove([storage_path]);
      if (storageError) {
        console.error(`DELETE /api/conversions/:id - Failed to delete input file from storage (${storage_bucket}/${storage_path}):`, storageError);
      }

      // Delete file record from files table
      const { error: fileDeleteError } = await serviceClient
        .from('files')
        .delete()
        .eq('id', fileId);
      if (fileDeleteError) {
        console.error(`DELETE /api/conversions/:id - Failed to delete input file record from database (${fileId}):`, fileDeleteError);
      }
    }

    // Log successful deletion for audit trail
    console.log('DELETE /api/conversions/:id - Successfully deleted conversion and all associated files:', {
      conversionId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/conversions/:id - Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversion' },
      { status: 500 }
    );
  }
}
