import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API endpoint to cleanup stale pending conversions
 * Marks conversions that have been pending for more than 1 hour as 'failed'
 * 
 * This can be called manually or set up as a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Update all pending conversions older than 1 hour to failed status
    const { data: updatedConversions, error } = await supabase
      .from('conversions')
      .update({
        status: 'failed',
        error_message: 'Conversion timed out - exceeded maximum processing time',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo)
      .select('id');

    if (error) {
      console.error('Error cleaning up pending conversions:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup pending conversions' },
        { status: 500 }
      );
    }

    const count = updatedConversions?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${count} stale pending conversion(s)`,
      count,
    });

  } catch (error) {
    console.error('Unexpected error cleaning up pending conversions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many stale pending conversions exist
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Count pending conversions older than 1 hour
    const { count, error } = await supabase
      .from('conversions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo);

    if (error) {
      console.error('Error counting pending conversions:', error);
      return NextResponse.json(
        { error: 'Failed to count pending conversions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      message: `Found ${count || 0} stale pending conversion(s)`,
    });

  } catch (error) {
    console.error('Unexpected error counting pending conversions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
