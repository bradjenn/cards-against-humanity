import { JudgeView } from "@/components/round/JudgeView";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import type { GamePlayer, Round } from "@/types/db";

export function JudgePanel({
  round,
  players,
  submissionsCount,
  onPickWinner,
}: {
  round: Round;
  players: GamePlayer[];
  submissionsCount: number;
  onPickWinner: (playerId: string) => void;
}) {
  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);

  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  // Show submissions as they come in, all blurred initially
  if (submissionsWithCards.length === 0) {
    return null;
  }

  return (
    <JudgeView
      submissions={submissionsWithCards}
      players={players}
      onPickWinner={onPickWinner}
      winningSubmissionId={round.winning_player_id}
      revealedCount={round.revealed_count}
      totalSubmissions={submissionsCount}
    />
  );
}
