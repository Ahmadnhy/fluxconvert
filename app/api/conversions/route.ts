import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { getUserConversions } from '@/src/lib/database/conversions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversions
 * 
 * Fetches the authenticated user's conversion history with pagination, filtering, and search.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - type: Filter by conversion type (e.g., 'word-to-pdf')
 * - status: Filter by status (e.g., 'completed', 'failed', 'pending')
 * - search: Search by filename
 * 
 * Response:
 * - conversions: Array of conversion records with file metadata
 * - pagination: Object containing page, limit, total, and totalPages
 * 
 * Requirements: 12.1, 12.3, 12.5, 12.6
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    // Fetch user conversions with filters
    const result = await getUserConversions(user.id, {
      page,
      limit,
      conversion_type: type,
      status,
      search,
    });

    // Handle errors from getUserConversions
    if (result.error) {
      console.error('Error fetching user conversions:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to fetch conversions' },
        { status: 500 }
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(result.total / result.limit);

    // Transform conversions to API response format
    const conversions = result.conversions.map((conversion) => ({
      id: conversion.id,
      conversionType: conversion.conversion_type,
      status: conversion.status,
      createdAt: conversion.created_at,
      completedAt: conversion.completed_at,
      inputFile: conversion.input_file ? {
        fileName: conversion.input_file.file_name,
        fileSize: conversion.input_file.file_size,
        fileType: conversion.input_file.file_type,
        createdAt: conversion.input_file.created_at,
      } : null,
      outputFile: conversion.output_file ? {
        fileName: conversion.output_file.file_name,
        fileSize: conversion.output_file.file_size,
        fileType: conversion.output_file.file_type,
        createdAt: conversion.output_file.created_at,
        status: conversion.output_file.status,
      } : null,
    }));

    // Return conversions with pagination metadata
    return NextResponse.json({
      conversions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
      },
    });

  } catch (error: any) {
    console.error('Error in GET /api/conversions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}
