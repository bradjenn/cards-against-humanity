import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { BottomToolbar } from "@/components/round/BottomToolbar";
import { JudgePanel } from "@/components/round/JudgePanel";
import { useAdvanceRound } from "@/hooks/mutations/useAdvanceRound";
import { usePickWinner } from "@/hooks/mutations/usePickWinner";
import { revealNextSubmission } from "@/server/round/revealNextSubmission";
import type { Card, Game, GamePlayer, Round } from "@/types/db";

interface JudgeRoundViewProps {
  game: Game;
  round: Round;
  players: GamePlayer[];
  blackCard: Card;
  submissionsCount: number;
  isCurrentRound: boolean;
  onOpenGameInfo: () => void;
  onGoToCurrentRound: () => void;
  onNavigateToRound: (roundNumber: number) => void;
}

export function JudgeRoundView({
  game,
  round,
  players,
  submissionsCount,
  isCurrentRound,
  onOpenGameInfo,
  onGoToCurrentRound,
  onNavigateToRound,
}: JudgeRoundViewProps) {
  const [revealing, setRevealing] = useState(false);
  const navigate = useNavigate();

  const pickWinnerMutation = usePickWinner();
  const advanceRoundMutation = useAdvanceRound();

  const hasWinner = !!round.winning_player_id;
  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;
  const isRevealing = allSubmitted && round.revealed_count < submissionsCount;

  const navigateToGameOver = useCallback(() => {
    navigate({
      to: "/game/$slug/game-over",
      params: { slug: game.slug },
    });
  }, [navigate, game.slug]);

  const pickWinner = useCallback(
    async (playerId: string) => {
      try {
        await pickWinnerMutation.mutateAsync({
          roundId: round.id,
          winningPlayerId: playerId,
        });
      } catch (err) {
        console.error("Failed to pick winner", err);
      }
    },
    [pickWinnerMutation, round.id],
  );

  const handleAdvanceRound = useCallback(async () => {
    try {
      const result = await advanceRoundMutation.mutateAsync({
        gameId: game.id,
        roundId: round.id,
      });

      if (result === null) {
        navigateToGameOver();
      } else {
        onNavigateToRound(result.round_number);
      }
    } catch (err) {
      console.error("Failed to advance round", err);
    }
  }, [
    advanceRoundMutation,
    game.id,
    round.id,
    onNavigateToRound,
    navigateToGameOver,
  ]);

  const handleRevealNext = useCallback(async () => {
    setRevealing(true);
    try {
      await revealNextSubmission({
        data: { roundId: round.id },
      });
    } finally {
      setRevealing(false);
    }
  }, [round.id]);

  const getToolbarContent = () => {
    if (hasWinner) {
      if (!isCurrentRound) {
        return {
          label: "Go to Current Round",
          onClick: onGoToCurrentRound,
          variant: "primary" as const,
        };
      }
      return {
        label: advanceRoundMutation.isPending
          ? "Starting next round…"
          : "Start next round",
        onClick: handleAdvanceRound,
        disabled: advanceRoundMutation.isPending,
        variant: "primary" as const,
      };
    }

    if (!allSubmitted) {
      return {
        message: `Waiting for players to submit (${submissionsCount}/${expectedSubmitters})`,
      };
    }

    if (isRevealing) {
      return {
        label: revealing ? "Revealing…" : "Reveal next submission",
        onClick: handleRevealNext,
        disabled: revealing,
        variant: "primary" as const,
      };
    }

    return {
      message: "Pick the winning submission above",
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-8 pb-24 space-y-8">
      <JudgePanel
        round={round}
        players={players}
        submissionsCount={submissionsCount}
        onPickWinner={pickWinner}
      />

      <BottomToolbar
        gameInfoButton={{ onClick: onOpenGameInfo }}
        content={getToolbarContent()}
      />
    </div>
  );
}
