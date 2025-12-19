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

    // 5 Update card stats for winning cards
    const { data: winningCards } = await supabase
      .from("submissions")
      .select("card_id")
      .eq("round_id", roundId)
      .eq("player_id", winningPlayerId);

    if (winningCards && winningCards.length > 0) {
      for (const { card_id } of winningCards) {
        // Upsert: increment times_won and times_played, or create if doesn't exist
        const { error: statsErr } = await supabase.rpc("increment_card_stats", {
          card_id_param: card_id,
          won: true,
        });

        if (statsErr) {
          console.error("Failed to update card stats:", statsErr);
        }
      }
    }

    // 6 Update card stats for all played cards in this round
    const { data: allSubmissions } = await supabase
      .from("submissions")
      .select("card_id, player_id")
      .eq("round_id", roundId);

    if (allSubmissions && allSubmissions.length > 0) {
      for (const submission of allSubmissions) {
        // Skip winning cards (already updated above)
        if (submission.player_id === winningPlayerId) continue;

        const { error: statsErr } = await supabase.rpc("increment_card_stats", {
          card_id_param: submission.card_id,
          won: false,
        });

        if (statsErr) {
          console.error("Failed to update card stats:", statsErr);
        }
      }
    }
  });
