import { SubmissionCard } from "@/components/round/SubmissionCard";
import { cn } from "@/lib/utils";
import type { Card, GamePlayer } from "@/types/db";

export function JudgeView({
  submissions,
  players,
  winningSubmissionId,
  onPickWinner,
}: {
  submissions: {
    submissionId: string;
    cards: Card[];
  }[];
  players: GamePlayer[];
  winningSubmissionId?: string | null;
  onPickWinner?: (submissionId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">
        {winningSubmissionId ? "Round results" : "Pick the winning submission"}
      </h3>

      <div className="grid gap-4">
        {submissions.map((submission) => {
          const isWinner = submission.submissionId === winningSubmissionId;
          const author = players.find((p) => p.id === submission.submissionId);

          return (
            <button
              key={submission.submissionId}
              type="button"
              disabled={!!winningSubmissionId}
              onClick={
                !winningSubmissionId && onPickWinner
                  ? () => onPickWinner(submission.submissionId)
                  : undefined
              }
              className={cn(
                "rounded-xl p-4 transition-all",
                isWinner ? "bg-success/10" : "bg-base-100 hover:bg-base-200",
                winningSubmissionId && !isWinner && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "font-semibold transition-all duration-300",
                    !winningSubmissionId && "blur select-none",
                  )}
                >
                  {author ? author.name : "Unknown"}
                </div>

                {isWinner && (
                  <span className="badge badge-success">Winner 🏆</span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {submission.cards.map((card) => (
                  <SubmissionCard key={card.id} card={card} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
