import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversions/[id]/download
 * 
 * Generates a fresh signed URL for downloading a converted file.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must own the conversion
 * - File must still exist (status is 'active')
 * 
 * Response:
 * - 200: { url: string, expiresAt: string }
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (user doesn't own the conversion)
 * - 404: Not found (conversion doesn't exist or file is deleted)
 * - 500: Server error
 * 
 * Requirements: 7.5, 12.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Require authentication
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversion ID from params
    const { id: conversionId } = await params;

    if (!conversionId) {
      return NextResponse.json(
        { error: 'Conversion ID is required' },
        { status: 400 }
      );
    }

    // Fetch conversion record with output file details
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .select(`
        id,
        user_id,
        status,
        output_file:output_file_id (
          id,
          file_name,
          storage_path,
          storage_bucket,
          status
        )
      `)
      .eq('id', conversionId)
      .single();

    // Handle conversion not found
    if (conversionError || !conversion) {
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    // Verify user owns the conversion
    if (conversion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this conversion' },
        { status: 403 }
      );
    }

    // Check if conversion has an output file
    if (!conversion.output_file) {
      return NextResponse.json(
        { error: 'Conversion has no output file' },
        { status: 404 }
      );
    }

    // Check if file still exists (status is 'active')
    const outputFile = conversion.output_file as any;
    if (outputFile.status !== 'active') {
      return NextResponse.json(
        { error: 'File has been deleted' },
        { status: 404 }
      );
    }

    // Generate signed URL with 1-hour expiration
    const expiresIn = 3600; // 1 hour in seconds
    const { url, error: urlError } = await generateSignedUrl(
      outputFile.storage_bucket,
      outputFile.storage_path,
      expiresIn
    );

    if (urlError || !url) {
      console.error('Failed to generate signed URL:', urlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Return signed URL and expiration
    return NextResponse.json({
      url,
      expiresAt,
    });

  } catch (error: any) {
    console.error('Error in GET /api/conversions/[id]/download:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
