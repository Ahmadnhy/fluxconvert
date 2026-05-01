import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with service role key
 * This client bypasses RLS and should only be used server-side
 * for operations that need elevated privileges (like anonymous uploads)
 * 
 * WARNING: Never expose this client to the browser!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
