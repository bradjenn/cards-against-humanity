import type { Card, GamePlayer } from "@/types/db";

export interface DealtHands {
  hands: Record<string, Card[]>;
  remainingWhiteDeck: Card[];
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealWhiteCardsToPlayers(
  whiteDeck: Card[],
  players: GamePlayer[],
  cardsPerPlayer: number,
): DealtHands {
  let deckIndex = 0;
  const hands: Record<string, Card[]> = {};

  for (const player of players) {
    const hand: Card[] = [];
    for (let i = 0; i < cardsPerPlayer; i++) {
      if (deckIndex >= whiteDeck.length) {
        break;
      }
      hand.push(whiteDeck[deckIndex]);
      deckIndex++;
    }
    hands[player.id] = hand;
  }

  const remainingWhiteDeck = whiteDeck.slice(deckIndex);
  return { hands, remainingWhiteDeck };
}

export function pickInitialBlackCard(blackDeck: Card[]): {
  blackCard: Card | null;
  remainingBlackDeck: Card[];
} {
  if (blackDeck.length === 0) {
    return { blackCard: null, remainingBlackDeck: [] };
  }

  const [first, ...rest] = blackDeck;
  return { blackCard: first, remainingBlackDeck: rest };
}
