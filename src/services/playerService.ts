import type { SupabaseClient } from "@supabase/supabase-js";

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
