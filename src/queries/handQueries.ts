import type { SupabaseClient } from "@supabase/supabase-js";
import type { Card } from "@/types/db";

type PlayerHandRow = {
  cards: Card;
};

export async function getPlayerHand(
  supabase: SupabaseClient,
  gameId: string,
  playerId: string,
): Promise<Card[]> {
  const { data, error } = await supabase
    .from("player_hands")
    .select("cards(*)")
    .eq("game_id", gameId)
    .eq("player_id", playerId);

  if (error || !data) return [];

  return (data as PlayerHandRow[]).map((row) => row.cards).filter(Boolean);
}
