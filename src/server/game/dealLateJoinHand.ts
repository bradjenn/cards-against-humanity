import type { SupabaseClient } from "@supabase/supabase-js";
import { dealWhiteCardsToPlayers } from "@/domain/deck";
import type { Card, GamePlayer } from "@/types/db";

export async function dealLateJoinHand(
  supabase: SupabaseClient,
  {
    gameId,
    player,
    cardsPerPlayer,
  }: {
    gameId: string;
    player: GamePlayer;
    cardsPerPlayer: number;
  },
) {
  // 1 Load remaining white deck from game
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("white_deck")
    .eq("id", gameId)
    .single();

  if (gameErr || !game?.white_deck) {
    throw new Error("White deck not available");
  }

  // 2 Load card records
  const { data: cards, error: cardsErr } = await supabase
    .from("cards")
    .select("*")
    .in("id", game.white_deck);

  if (cardsErr || !cards) {
    throw new Error("Could not load white cards");
  }

  // 3 Deal cards using domain logic
  const { hands, remainingWhiteDeck } = dealWhiteCardsToPlayers(
    cards as Card[],
    [player],
    cardsPerPlayer,
  );

  const hand = hands[player.id] ?? [];

  // 4 Persist player hand
  if (hand.length > 0) {
    const { error: handErr } = await supabase.from("player_hands").insert(
      hand.map((card) => ({
        game_id: gameId,
        player_id: player.id,
        card_id: card.id,
      })),
    );

    if (handErr) {
      throw new Error("Could not save late join hand");
    }
  }

  // 5 Persist updated deck
  await supabase
    .from("games")
    .update({
      white_deck: remainingWhiteDeck.map((c) => c.id),
    })
    .eq("id", gameId);
}
