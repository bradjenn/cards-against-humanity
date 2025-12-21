import { createServerFn } from "@tanstack/react-start";
import { shuffle } from "@/domain/deck";
import { pickNextJudge } from "@/domain/rules";
import { supabaseAdmin } from "@/server/supabaseAdmin";
import type { Card, Game, GamePlayer, Round } from "@/types/db";

function assert<T>(value: T | null, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

export const advanceRound = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { gameId: string; roundId: string; handSize?: number }) => data,
  )
  .handler(async ({ data }): Promise<Round | null> => {
    const supabase = supabaseAdmin();
    const { gameId, roundId, handSize = 10 } = data;

    /* --------------------------------
     * 1. Load game
     * -------------------------------- */
    const game = assert(
      (await supabase.from("games").select("*").eq("id", gameId).single())
        .data as Game | null,
      "Game not found",
    );

    /* --------------------------------
     * 2. Load players (join order)
     * -------------------------------- */
    const players = assert(
      (
        await supabase
          .from("game_players")
          .select("*")
          .eq("game_id", gameId)
          .order("joined_at", { ascending: true })
      ).data as GamePlayer[] | null,
      "Players not found",
    );

    /* --------------------------------
     * 3. Load submissions (one row per card)
     * -------------------------------- */
    const submissions =
      (
        await supabase
          .from("submissions")
          .select("player_id, card_id")
          .eq("round_id", roundId)
      ).data ?? [];

    const submittedCardIds = submissions.map((s) => s.card_id);

    /* --------------------------------
     * 4. Remove submitted cards from hands
     * -------------------------------- */
    if (submittedCardIds.length > 0) {
      const { error } = await supabase
        .from("player_hands")
        .delete()
        .eq("game_id", gameId)
        .in("card_id", submittedCardIds);

      if (error) throw error;
    }

    /* --------------------------------
     * 5. Build remaining WHITE deck (derived)
     * -------------------------------- */

    // Cards currently in hands
    const inHandIds =
      (
        await supabase
          .from("player_hands")
          .select("card_id")
          .eq("game_id", gameId)
      ).data?.map((r) => r.card_id) ?? [];

    const excludedWhiteIds = [...inHandIds, ...submittedCardIds];

    const { data: availableWhiteCards, error: whiteErr } = await supabase
      .from("cards")
      .select("*")
      .eq("type", "WHITE")
      .in("pack_id", game.packs)
      .not(
        "id",
        "in",
        excludedWhiteIds.length ? `(${excludedWhiteIds.join(",")})` : "()",
      );

    if (whiteErr) throw whiteErr;

    const whiteDeck = shuffle(availableWhiteCards as Card[]);
    let whiteIndex = 0;

    /* --------------------------------
     * 6. Refill each player's hand
     * -------------------------------- */
    for (const player of players) {
      const { count } = await supabase
        .from("player_hands")
        .select("id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .eq("player_id", player.id);

      const need = handSize - (count ?? 0);
      if (need <= 0) continue;

      const draw = whiteDeck.slice(whiteIndex, whiteIndex + need);
      whiteIndex += draw.length;

      if (draw.length === 0) break;

      const rows = draw.map((card) => ({
        game_id: gameId,
        player_id: player.id,
        card_id: card.id,
      }));

      const { error } = await supabase.from("player_hands").insert(rows);
      if (error) throw error;
    }

    /* --------------------------------
     * 7. Pick next BLACK card (derived)
     * -------------------------------- */
    const usedBlackIds =
      (
        await supabase
          .from("rounds")
          .select("black_card_id")
          .eq("game_id", gameId)
      ).data?.map((r) => r.black_card_id) ?? [];

    const { data: blackCards, error: blackErr } = await supabase
      .from("cards")
      .select("*")
      .eq("type", "BLACK")
      .in("pack_id", game.packs)
      .not(
        "id",
        "in",
        usedBlackIds.length ? `(${usedBlackIds.join(",")})` : "()",
      );

    if (blackErr) throw blackErr;

    const blackDeck = shuffle((blackCards ?? []) as Card[]);
    const remainingBlackCards = blackDeck.length;

    /* --------------------------------
     * 7a. Check if game should end
     * -------------------------------- */

    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const leader = sortedPlayers[0];
    const secondPlace = sortedPlayers[1] ?? { score: 0 };

    // Condition 1: No more black cards
    const noCardsLeft = remainingBlackCards === 0;

    // Condition 2: Mathematical victory (leader can't be caught)
    const mathematicalVictory =
      leader && leader.score > secondPlace.score + remainingBlackCards;

    if (noCardsLeft || mathematicalVictory) {
      // Game is over - mark as finished
      await supabase
        .from("games")
        .update({
          status: "FINISHED",
        })
        .eq("id", gameId);

      return null; // No next round, game has ended
    }

    const nextBlack = blackDeck[0];

    /* --------------------------------
     * 8. Rotate judge
     * -------------------------------- */
    const { judge, index: nextJudgeIndex } = pickNextJudge(
      players,
      game.judge_index ?? 0,
    );

    /* --------------------------------
     * 9. Create next round
     * -------------------------------- */
    const nextRoundNumber = (game.round_number ?? 0) + 1;

    const newRound = assert(
      (
        await supabase
          .from("rounds")
          .insert({
            game_id: gameId,
            round_number: nextRoundNumber,
            black_card_id: nextBlack.id,
            judge_id: judge.id,
            winning_player_id: null,
            revealed_count: 0,
          })
          .select()
          .single()
      ).data as Round | null,
      "Failed to create next round",
    );

    /* --------------------------------
     * 10. Update game pointer
     * -------------------------------- */
    const { error: gameErr } = await supabase
      .from("games")
      .update({
        round_number: nextRoundNumber,
        judge_index: nextJudgeIndex,
      })
      .eq("id", gameId);

    if (gameErr) throw gameErr;

    return newRound;
  });
