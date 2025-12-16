import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server",
    );
  }

  _client = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}
