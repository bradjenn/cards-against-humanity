import { JudgeReveal } from "@/components/round/JudgeReveal";
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
  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;

  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);

  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  const revealed = submissionsWithCards.slice(0, round.revealed_count);

  if (!allSubmitted) {
    return null;
  }

  if (round.revealed_count < submissionsWithCards.length) {
    return (
      <JudgeReveal
        revealedSubmissions={revealed}
        totalSubmissions={submissionsWithCards.length}
        players={players}
      />
    );
  }

  return (
    <JudgeView
      submissions={submissionsWithCards}
      players={players}
      onPickWinner={onPickWinner}
      winningSubmissionId={round.winning_player_id}
    />
  );
}
