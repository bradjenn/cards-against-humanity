import type { GamePlayer } from "@/types/db";

export function canStartGame(players: GamePlayer[]): boolean {
  return players.length >= 3;
}

export function pickInitialJudge(players: GamePlayer[]): GamePlayer | null {
  if (players.length === 0) return null;
  return players[0];
}

export function pickNextJudge(
  players: GamePlayer[],
  currentJudgeIndex: number,
): { judge: GamePlayer; index: number } {
  if (players.length === 0) {
    throw new Error("No players available to pick a judge");
  }

  const nextIndex = (currentJudgeIndex + 1) % players.length;
  const judge = players[nextIndex];

  if (!judge) {
    throw new Error("Failed to pick next judge");
  }

  return {
    judge,
    index: nextIndex,
  };
}
