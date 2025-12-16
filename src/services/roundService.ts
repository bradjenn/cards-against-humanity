import type { SupabaseClient } from "@supabase/supabase-js";

export async function submitRoundCards(
  supabase: SupabaseClient,
  {
    roundId,
    playerId,
    cardIds,
  }: {
    roundId: string;
    playerId: string;
    cardIds: string[];
  },
) {
  const rows = cardIds.map((cardId) => ({
    round_id: roundId,
    player_id: playerId,
    card_id: cardId,
  }));

  const { error } = await supabase.from("submissions").insert(rows);

  if (error) {
    throw error;
  }
}
