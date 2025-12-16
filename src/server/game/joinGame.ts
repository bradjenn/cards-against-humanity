import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamePlayer } from "@/types/db";

export interface JoinGameInput {
  gameId: string;
  name: string;
}

export async function joinGame(
  supabase: SupabaseClient,
  input: JoinGameInput,
): Promise<GamePlayer> {
  const trimmedName = input.name.trim();
  if (!trimmedName) throw new Error("Name is required");

  const { data, error } = await supabase
    .from("game_players")
    .insert({
      game_id: input.gameId,
      name: trimmedName,
      is_connected: true,
    })
    .select()
    .single<GamePlayer>();

  if (error || !data) {
    throw new Error("Could not join game");
  }

  return data;
}
