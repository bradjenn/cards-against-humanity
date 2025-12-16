import { useState } from "react";
import { JudgeReveal } from "@/components/round/JudgeReveal";
import { JudgeView } from "@/components/round/JudgeView";
import { JudgeWaiting } from "@/components/round/JudgeWaiting";
import { useSupabase } from "@/components/SupabaseProvider";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import { advanceRound } from "@/server/round/advanceRound";
import { revealNextSubmission } from "@/server/round/revealNextSubmission";
import type { GamePlayer, Round } from "@/types/db";

export function JudgePanel({
  round,
  gameId,
  players,
  submissionsCount,
  onPickWinner,
}: {
  gameId: string;
  round: Round;
  players: GamePlayer[];
  submissionsCount: number;
  onPickWinner: (playerId: string) => void;
}) {
  const supabase = useSupabase();
  const [revealing, setRevealing] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;

  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);

  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  const revealed = submissionsWithCards.slice(0, round.revealed_count);

  async function handleRevealNext() {
    setRevealing(true);
    try {
      await revealNextSubmission(supabase, {
        roundId: round.id,
      });
    } finally {
      setRevealing(false);
    }
  }

  async function handleAdvanceRound() {
    setAdvancing(true);
    try {
      await advanceRound({
        data: {
          gameId,
          roundId: round.id,
        },
      });
    } catch (err) {
      console.error("Failed to advance round", err);
    } finally {
      setAdvancing(false);
    }
  }

  if (!allSubmitted) {
    return <JudgeWaiting />;
  }

  if (round.revealed_count < submissionsWithCards.length) {
    return (
      <JudgeReveal
        revealedSubmissions={revealed}
        totalSubmissions={submissionsWithCards.length}
        onRevealNext={handleRevealNext}
        isRevealing={revealing}
      />
    );
  }

  if (round.winning_player_id) {
  }

  return (
    <div className="space-y-6">
      <JudgeView
        submissions={submissionsWithCards}
        players={players}
        onPickWinner={onPickWinner}
        winningSubmissionId={round.winning_player_id}
      />

      {round.winning_player_id && (
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={advancing}
          onClick={handleAdvanceRound}
        >
          {advancing ? "Starting next round…" : "Start next round"}
        </button>
      )}
    </div>
  );
}
