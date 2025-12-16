import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/server/supabaseAdmin";

export const pickRoundWinner = createServerFn({ method: "POST" })
  .inputValidator((data: { roundId: string; winningPlayerId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin();
    const { roundId, winningPlayerId } = data;

    // 1 Load round
    const { data: round, error: roundErr } = await supabase
      .from("rounds")
      .select("id, winning_player_id")
      .eq("id", roundId)
      .single();

    if (roundErr || !round) {
      throw new Error("Round not found");
    }

    // 2 Idempotency guard
    if (round.winning_player_id) {
      return;
    }

    // 3 Persist winner
    const { error: updateErr } = await supabase
      .from("rounds")
      .update({
        winning_player_id: winningPlayerId,
      })
      .eq("id", roundId);

    if (updateErr) {
      throw new Error("Could not pick round winner");
    }

    // 4 Increment score atomically
    const { error: rpcErr } = await supabase.rpc("increment_player_score", {
      player_id: winningPlayerId,
    });

    if (rpcErr) {
      throw new Error("Failed to increment player score");
    }
  });
