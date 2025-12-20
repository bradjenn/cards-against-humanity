import { SubmissionCard } from "@/components/round/SubmissionCard";
import { cn } from "@/lib/utils";
import type { Card, GamePlayer } from "@/types/db";

export function JudgeView({
  submissions,
  players,
  winningSubmissionId,
  onPickWinner,
  revealedCount,
  totalSubmissions,
}: {
  submissions: {
    submissionId: string;
    cards: Card[];
  }[];
  players: GamePlayer[];
  winningSubmissionId?: string | null;
  onPickWinner?: (submissionId: string) => void;
  revealedCount?: number;
  totalSubmissions?: number;
}) {
  const total = totalSubmissions ?? submissions.length;
  const allRevealed = revealedCount === undefined || revealedCount >= total;
  const isRevealing = revealedCount !== undefined && revealedCount > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">
        {winningSubmissionId
          ? "Round results"
          : allRevealed
            ? "Pick the winning submission"
            : isRevealing
              ? `Revealing submissions (${revealedCount} / ${total})`
              : `Submissions (${submissions.length} / ${total})`}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {submissions.map((submission, index) => {
          const isWinner = submission.submissionId === winningSubmissionId;
          const author = players.find((p) => p.id === submission.submissionId);
          const isRevealed =
            revealedCount === undefined || index < revealedCount || allRevealed;

          return (
            <button
              key={submission.submissionId}
              type="button"
              disabled={!!winningSubmissionId || !isRevealed || !allRevealed}
              onClick={
                !winningSubmissionId &&
                onPickWinner &&
                allRevealed &&
                isRevealed
                  ? () => onPickWinner(submission.submissionId)
                  : undefined
              }
              className={cn(
                "rounded-xl p-4 transition-all",
                isWinner ? "bg-success/10" : "bg-base-100",
                !isRevealed && "opacity-50",
                isRevealed &&
                  !winningSubmissionId &&
                  allRevealed &&
                  "hover:bg-base-200 cursor-pointer",
                winningSubmissionId && !isWinner && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "font-semibold transition-all duration-300",
                    !winningSubmissionId && "blur-sm select-none",
                  )}
                >
                  {author ? author.name : "Unknown"}
                </div>

                {isWinner && (
                  <span className="badge badge-success">Winner 🏆</span>
                )}
              </div>

              <div
                className={cn(
                  "grid grid-cols-2 gap-3 transition-all duration-300",
                  !isRevealed && "blur-sm",
                )}
              >
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
