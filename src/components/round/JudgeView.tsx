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
              className={[
                "border rounded-xl p-4 transition",
                isWinner
                  ? "border-success bg-success/10"
                  : "hover:border-primary",
                winningSubmissionId && !isWinner && "opacity-60",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={[
                    "font-semibold transition-all duration-300",
                    !winningSubmissionId && "blur-sm opacity-50 select-none",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {author ? author.name : "Unknown"}
                </div>

                {isWinner && (
                  <span className="badge badge-success">Winner 🏆</span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {submission.cards.map((card) => (
                  <div
                    key={card.id}
                    className="card bg-base-100 border-2 min-h-14 p-3 text-sm"
                  >
                    {card.text}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
