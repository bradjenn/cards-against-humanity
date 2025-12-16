import type { SupabaseClient } from "@supabase/supabase-js";

export async function revealNextSubmission(
  supabase: SupabaseClient,
  {
    roundId,
  }: {
    roundId: string;
  },
) {
  // 1 Load round + submission count
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .select("id, revealed_count")
    .eq("id", roundId)
    .single();

  if (roundErr || !round) {
    throw new Error("Round not found");
  }

  const { count: submissionCount, error: countErr } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("round_id", roundId);

  if (countErr || submissionCount === null) {
    throw new Error("Could not count submissions");
  }

  // 2 Guard: do not exceed submission count
  if (round.revealed_count >= submissionCount) {
    return; // nothing to do (idempotent)
  }

  // 3 Increment revealed_count
  const { error: updateErr } = await supabase
    .from("rounds")
    .update({
      revealed_count: round.revealed_count + 1,
    })
    .eq("id", roundId);

  if (updateErr) {
    throw new Error("Could not reveal next submission");
  }
}
