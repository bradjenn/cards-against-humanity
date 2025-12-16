import type { SupabaseClient } from "@supabase/supabase-js";

export type JudgeSubmission = {
  player_id: string;
  card_ids: string[];
};

// queries/judgeQueries.ts
export async function getSubmissionsForJudge(
  supabase: SupabaseClient,
  roundId: string,
) {
  const { data, error } = await supabase
    .from("submissions")
    .select("player_id, card_id")
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group rows by player
  const grouped: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!grouped[row.player_id]) {
      grouped[row.player_id] = [];
    }
    grouped[row.player_id].push(row.card_id);
  }

  return Object.entries(grouped).map(([player_id, card_ids]) => ({
    player_id,
    card_ids,
  }));
}
