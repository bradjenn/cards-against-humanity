import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamePlayer } from "@/types/db";

export async function fetchPlayersForGame(
  supabase: SupabaseClient,
  gameId: string,
): Promise<GamePlayer[]> {
  const { data } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  return (data ?? []) as GamePlayer[];
}

export async function setPlayerConnected(
  supabase: SupabaseClient,
  playerId: string,
  isConnected: boolean,
): Promise<void> {
  await supabase
    .from("game_players")
    .update({ is_connected: isConnected })
    .eq("id", playerId);
}
