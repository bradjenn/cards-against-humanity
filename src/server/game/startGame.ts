import type { SupabaseClient } from "@supabase/supabase-js";
import { pickInitialBlackCard, shuffle } from "@/domain/deck";
import { canStartGame, pickInitialJudge } from "@/domain/rules";
import type { Card, Game, GamePlayer } from "@/types/db";
import { dealWhiteHandsForPlayers } from "./dealWhiteHandsForPlayers";

export interface StartGameInput {
  gameId: string;
  whiteCardsPerPlayer: number; // 10 for you
}

export async function startGame(
  supabase: SupabaseClient,
  input: StartGameInput,
): Promise<void> {
  const { gameId, whiteCardsPerPlayer } = input;

  // 1. Fetch game
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single<Game>();

  if (gameErr || !game) {
    throw new Error("Game not found");
  }

  // 2. Fetch players
  const { data: playersData, error: playersErr } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", game.id)
    .order("joined_at", { ascending: true });

  if (playersErr) throw new Error("Could not load players");

  const players = (playersData ?? []) as GamePlayer[];
  if (!canStartGame(players)) {
    throw new Error("Not enough players to start the game");
  }

  // 3. Fetch cards by packs
  const { data: whiteCardsData, error: whiteErr } = await supabase
    .from("cards")
    .select("*")
    .in("pack_id", game.packs)
    .eq("type", "WHITE");

  const { data: blackCardsData, error: blackErr } = await supabase
    .from("cards")
    .select("*")
    .in("pack_id", game.packs)
    .eq("type", "BLACK");

  if (whiteErr || blackErr) {
    throw new Error("Could not load cards");
  }

  const whiteDeck = shuffle((whiteCardsData ?? []) as Card[]);
  const blackDeck = shuffle((blackCardsData ?? []) as Card[]);

  // 4. Deal white cards
  const { remainingWhiteDeck } = await dealWhiteHandsForPlayers(supabase, {
    gameId: game.id,
    whiteDeck,
    players,
    cardsPerPlayer: whiteCardsPerPlayer,
  });

  // 5. Pick black card + judge
  const { blackCard, remainingBlackDeck } = pickInitialBlackCard(blackDeck);
  if (!blackCard) throw new Error("No black cards available");

  const judge = pickInitialJudge(players);
  if (!judge) throw new Error("No judge available");

  // 6. Insert round
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .insert({
      game_id: game.id,
      round_number: 1,
      black_card_id: blackCard.id,
      judge_id: judge.id,
      winning_player_id: null,
    })
    .select()
    .single();

  if (roundErr || !round) {
    throw new Error("Could not create initial round");
  }

  // 8. Update game status to IN_PROGRESS
  await supabase
    .from("games")
    .update({
      status: "IN_PROGRESS",
      round_number: 1,
      white_deck: remainingWhiteDeck.map((c) => c.id),
      black_deck: remainingBlackDeck.map((c) => c.id),
    })
    .eq("id", game.id);
}
