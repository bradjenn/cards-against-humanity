import type { SupabaseClient } from "@supabase/supabase-js";
import type { Card, Round } from "@/types/db";

export async function getRoundByNumber(
  supabase: SupabaseClient,
  gameId: string,
  roundNumber: number,
): Promise<Round | null> {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .single<Round>();

  if (error || !data) return null;
  return data;
}

export async function getBlackCardForRound(
  supabase: SupabaseClient,
  blackCardId: string,
): Promise<Card | null> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", blackCardId)
    .single<Card>();

  if (error || !data) return null;
  return data;
}

export async function getSubmissionCount(
  supabase: SupabaseClient,
  roundId: string,
): Promise<number> {
  const { data: submissionPlayers } = await supabase
    .from("submissions")
    .select("player_id")
    .eq("round_id", roundId);

  const submissionsCount = submissionPlayers
    ? new Set(submissionPlayers.map((s) => s.player_id)).size
    : 0;

  return submissionsCount;
}
