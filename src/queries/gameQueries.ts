import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game } from "../types/db";

export async function getGameBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .single<Game>();

  if (error || !data) return null;
  return data;
}
