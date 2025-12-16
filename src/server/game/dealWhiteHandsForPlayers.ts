import type { SupabaseClient } from "@supabase/supabase-js";
import { dealWhiteCardsToPlayers } from "@/domain/deck";
import type { Card, GamePlayer } from "@/types/db";

export async function dealWhiteHandsForPlayers(
  supabase: SupabaseClient,
  {
    gameId,
    whiteDeck,
    players,
    cardsPerPlayer,
  }: {
    gameId: string;
    whiteDeck: Card[];
    players: GamePlayer[];
    cardsPerPlayer: number;
  },
): Promise<{
  remainingWhiteDeck: Card[];
}> {
  // 1. Domain logic
  const { hands, remainingWhiteDeck } = dealWhiteCardsToPlayers(
    whiteDeck,
    players,
    cardsPerPlayer,
  );

  // 2. Persist hands
  const handRows = Object.entries(hands).flatMap(([playerId, cards]) =>
    cards.map((card) => ({
      game_id: gameId,
      player_id: playerId,
      card_id: card.id,
    })),
  );

  if (handRows.length > 0) {
    const { error } = await supabase.from("player_hands").insert(handRows);

    if (error) {
      throw new Error("Could not save player hands");
    }
  }

  return { remainingWhiteDeck };
}
