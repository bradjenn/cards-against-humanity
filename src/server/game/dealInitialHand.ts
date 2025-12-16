import type { SupabaseClient } from "@supabase/supabase-js";

export async function dealInitialHand(
  supabase: SupabaseClient,
  {
    gameId,
    playerId,
    whiteCardsPerPlayer,
  }: {
    gameId: string;
    playerId: string;
    whiteCardsPerPlayer: number;
  },
) {
  // 1 Check if the player already has cards (idempotency)
  const { data: existingCards, error: existingError } = await supabase
    .from("player_cards")
    .select("card_id")
    .eq("game_id", gameId)
    .eq("player_id", playerId);

  if (existingError) throw existingError;

  if (existingCards && existingCards.length >= whiteCardsPerPlayer) {
    // ✅ Already dealt
    return;
  }

  const alreadyHas = new Set(existingCards?.map((c) => c.card_id) ?? []);

  const needed = whiteCardsPerPlayer - alreadyHas.size;
  if (needed <= 0) return;

  // 2 Get all used card IDs for this game
  const { data: usedCards, error: usedError } = await supabase
    .from("player_cards")
    .select("card_id")
    .eq("game_id", gameId);

  if (usedError) throw usedError;

  const usedCardIds = usedCards?.map((c) => c.card_id) ?? [];

  // 3 Select random unused white cards
  const { data: newCards, error: cardError } = await supabase
    .from("cards")
    .select("id")
    .eq("type", "WHITE")
    .not("id", "in", `(${usedCardIds.join(",")})`)
    .limit(needed);

  if (cardError) throw cardError;
  if (!newCards || newCards.length < needed) {
    throw new Error("Not enough white cards remaining.");
  }

  // 4 Insert player_cards rows
  const inserts = newCards.map((card) => ({
    game_id: gameId,
    player_id: playerId,
    card_id: card.id,
  }));

  const { error: insertError } = await supabase
    .from("player_cards")
    .insert(inserts);

  if (insertError) throw insertError;
}
