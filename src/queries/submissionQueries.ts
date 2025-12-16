import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasPlayerSubmitted(
  supabase: SupabaseClient,
  {
    roundId,
    playerId,
  }: {
    roundId: string;
    playerId: string;
  },
): Promise<boolean> {
  const { data } = await supabase
    .from("submissions")
    .select("id")
    .eq("round_id", roundId)
    .eq("player_id", playerId)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function getPlayerSubmittedCardIds(
  supabase: SupabaseClient,
  {
    roundId,
    playerId,
  }: {
    roundId: string;
    playerId: string;
  },
): Promise<string[]> {
  const { data } = await supabase
    .from("submissions")
    .select("card_id")
    .eq("round_id", roundId)
    .eq("player_id", playerId);

  return data?.map((row) => row.card_id) ?? [];
}
