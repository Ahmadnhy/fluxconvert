import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { getRateLimitStatus } from '@/src/lib/middleware/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/quota
 * 
 * Returns the authenticated user's current rate limit status.
 * 
 * Response:
 * - limit: The rate limit (10 for authenticated users)
 * - used: Number of requests used in current window
 * - remaining: Number of requests remaining
 * - resetAt: ISO timestamp of when the limit resets
 * 
 * Requirements: 9.1, 9.2, 9.4
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

    // Get rate limit status for the authenticated user
    const identifier = user.id;
    const isAuthenticated = true;
    
    const rateLimitStatus = getRateLimitStatus(identifier, isAuthenticated);

    // Calculate used count
    const used = rateLimitStatus.limit - rateLimitStatus.remaining;

    // Return quota information
    return NextResponse.json({
      limit: rateLimitStatus.limit,
      used,
      remaining: rateLimitStatus.remaining,
      resetAt: rateLimitStatus.resetAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching quota:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quota' },
      { status: 500 }
    );
  }
}
