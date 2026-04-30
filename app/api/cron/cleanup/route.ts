import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldFiles } from '@/src/lib/jobs/fileCleanup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/cleanup
 * 
 * Triggers the file cleanup job to delete files older than 7 days.
 * This endpoint is designed to be called by Vercel Cron or other schedulers.
 * 
 * Security:
 * - Requires CRON_SECRET in Authorization header to prevent unauthorized access
 * 
 * Response:
 * - totalProcessed: Number of files processed
 * - successfullyDeleted: Number of files successfully deleted
 * - failed: Number of files that failed to delete
 * - errors: Array of error details for failed deletions
 * 
 * Requirements: 10.1
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if CRON_SECRET is configured
    if (!cronSecret) {
      console.error('[Cleanup Cron] CRON_SECRET environment variable is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the authorization header matches the secret
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cleanup Cron] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cleanup Cron] Starting scheduled file cleanup job');

    // Execute the cleanup job
    const summary = await cleanupOldFiles();

    console.log('[Cleanup Cron] Cleanup job completed successfully');
    console.log(`[Cleanup Cron] Summary: ${summary.successfullyDeleted}/${summary.totalProcessed} files deleted`);

    // Return execution summary
    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: summary.totalProcessed,
        successfullyDeleted: summary.successfullyDeleted,
        failed: summary.failed,
        errors: summary.errors,
      },
    });

  } catch (error: any) {
    console.error('[Cleanup Cron] Error executing cleanup job:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to execute cleanup job',
        success: false,
      },
      { status: 500 }
    );
  }
}
