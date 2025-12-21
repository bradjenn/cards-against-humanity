import type { SupabaseClient } from "@supabase/supabase-js";

export type RouterContext = {
  supabase: SupabaseClient;
};
