import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/server/supabaseAdmin";

export const revealNextSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: { roundId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin();
    const { roundId } = data;

    // 1 Load round + submission count
    const { data: round, error: roundErr } = await supabase
      .from("rounds")
      .select("id, revealed_count")
      .eq("id", roundId)
      .single();

    if (roundErr || !round) {
      throw new Error("Round not found");
    }

    // Count unique players who submitted (not total cards)
    const { data: submissions, error: countErr } = await supabase
      .from("submissions")
      .select("player_id")
      .eq("round_id", roundId);

    if (countErr || !submissions) {
      throw new Error("Could not count submissions");
    }

    // Get unique player count
    const uniquePlayers = new Set(submissions.map((s) => s.player_id));
    const submissionCount = uniquePlayers.size;

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
  });
