import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Get Supabase configuration from environment variables.
 * Returns placeholder values if not configured (for build/SSG).
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return placeholder values for build time
    // Actual API calls will fail, but the build will succeed
    return { 
      supabaseUrl: "https://placeholder.supabase.co", 
      supabaseAnonKey: "placeholder-key",
      isConfigured: false,
    };
  }

  return { supabaseUrl, supabaseAnonKey, isConfigured: true };
}

const config = getSupabaseConfig();

/**
 * Check if Supabase is properly configured.
 */
export function isSupabaseConfigured(): boolean {
  return config.isConfigured;
}

/**
 * Supabase client for database operations.
 * Note: May use placeholder values during build - check isSupabaseConfigured() before making calls.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, "public", any> = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Get the Supabase client for server-side operations.
 * Uses service role key for admin operations when available.
 */
export function getServerSupabase(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey && config.isConfigured) {
    return createClient(config.supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabase;
}

// Export for server-side usage
export default supabase;
