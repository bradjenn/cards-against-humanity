import type { QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RouterContext = {
  supabase: SupabaseClient;
  queryClient: QueryClient;
};
