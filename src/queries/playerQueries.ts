import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamePlayer } from "@/types/db";

export async function getPlayersForGame(
  supabase: SupabaseClient,
  gameId: string,
): Promise<GamePlayer[]> {
  const { data, error } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return data as GamePlayer[];
}
