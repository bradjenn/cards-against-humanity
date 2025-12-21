import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { BottomToolbar } from "@/components/round/BottomToolbar";
import { JudgeView } from "@/components/round/JudgeView";
import { PlayerHand } from "@/components/round/PlayerHand";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { useSubmittedCards } from "@/hooks/useSubmittedCards";
import { submitRoundCards } from "@/services/roundService";
import type { Card, Game, GamePlayer, Round } from "@/types/db";

interface PlayerRoundViewProps {
  supabase: SupabaseClient;
  game: Game;
  round: Round;
  players: GamePlayer[];
  blackCard: Card;
  localPlayerId: string | null;
  submissionsCount: number;
  isCurrentRound: boolean;
  onOpenGameInfo: () => void;
  onGoToCurrentRound: () => void;
}

export function PlayerRoundView({
  supabase,
  game,
  round,
  players,
  blackCard,
  localPlayerId,
  submissionsCount,
  isCurrentRound,
  onOpenGameInfo,
  onGoToCurrentRound,
}: PlayerRoundViewProps) {
  const pick = blackCard.pick ?? 1;
  const hasWinner = !!round.winning_player_id;
  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const { hand } = usePlayerHand({
    gameId: game.id,
    playerId: localPlayerId,
    enabled: !!localPlayerId,
    roundId: round.id,
  });

  const { submittedCardIds, hasSubmitted } = useSubmittedCards({
    roundId: round.id,
    playerId: localPlayerId,
  });

  // For viewing results when winner is picked
  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);
  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  // Reset selection when round changes
  useEffect(() => {
    if (!round.id) return;
    setSelectedCardIds([]);
  }, [round.id]);

  const toggleCard = useCallback(
    (cardId: string) => {
      setSelectedCardIds((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId);
        }
        if (prev.length >= pick) {
          return prev;
        }
        return [...prev, cardId];
      });
    },
    [pick],
  );

  const submitCards = useCallback(async () => {
    if (!localPlayerId) return;

    try {
      await submitRoundCards(supabase, {
        roundId: round.id,
        playerId: localPlayerId,
        cardIds: selectedCardIds,
      });
      setSelectedCardIds([]);
    } catch (err) {
      console.error("Failed to submit cards", err);
    }
  }, [localPlayerId, supabase, round.id, selectedCardIds]);

  // Show results view when winner is picked
  if (hasWinner) {
    return (
      <>
        <JudgeView
          submissions={submissionsWithCards}
          players={players}
          winningSubmissionId={round.winning_player_id}
          totalSubmissions={submissionsCount}
        />

        <BottomToolbar
          gameInfoButton={{ onClick: onOpenGameInfo }}
          content={
            !isCurrentRound
              ? {
                  label: "Go to Current Round",
                  onClick: onGoToCurrentRound,
                  variant: "primary",
                }
              : {
                  message: "Waiting for judge to start next round…",
                }
          }
        />
      </>
    );
  }

  // Show card submission view
  return (
    <>
      <PlayerHand
        key={round.id}
        cards={hand}
        selectedCardIds={!hasSubmitted ? selectedCardIds : []}
        submittedCardIds={hasSubmitted ? submittedCardIds : []}
        onToggleCard={hasSubmitted ? undefined : toggleCard}
        disabled={hasSubmitted}
        playerScore={players.find((p) => p.id === localPlayerId)?.score ?? 0}
      />

      <BottomToolbar
        gameInfoButton={{ onClick: onOpenGameInfo }}
        content={
          hasSubmitted
            ? {
                message: allSubmitted
                  ? "Waiting for judge to pick winner…"
                  : "Waiting for other players to submit…",
              }
            : {
                label: `Submit ${pick} Card${pick > 1 ? "s" : ""}`,
                onClick: submitCards,
                disabled: selectedCardIds.length !== pick,
                variant: "primary",
              }
        }
      />
    </>
  );
}
