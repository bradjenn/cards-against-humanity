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

  // Check if player with this name already exists in this game
  const { data: existingPlayer } = await supabase
    .from("game_players")
    .select()
    .eq("game_id", input.gameId)
    .eq("name", trimmedName)
    .single<GamePlayer>();

  // If player already exists, reconnect them instead of creating duplicate
  if (existingPlayer) {
    // Update their connection status
    const { data: reconnectedPlayer, error: updateError } = await supabase
      .from("game_players")
      .update({ is_connected: true })
      .eq("id", existingPlayer.id)
      .select()
      .single<GamePlayer>();

    if (updateError || !reconnectedPlayer) {
      throw new Error("Could not reconnect to game");
    }

    return reconnectedPlayer;
  }

  // Create new player if they don't exist in this game
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
