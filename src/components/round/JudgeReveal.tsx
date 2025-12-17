import type { Card, GamePlayer } from "@/types/db";
import { SubmissionCard } from "@/components/round/SubmissionCard";

export function JudgeReveal({
  revealedSubmissions,
  totalSubmissions,
  players,
}: {
  revealedSubmissions: {
    submissionId: string;
    cards: Card[];
  }[];
  totalSubmissions: number;
  players: GamePlayer[];
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">
        Revealing submissions ({revealedSubmissions.length} / {totalSubmissions}
        )
      </h3>

      <div className="space-y-4">
        {revealedSubmissions.map((submission) => {
          const author = players.find((p) => p.id === submission.submissionId);

          return (
            <div
              key={submission.submissionId}
              className="rounded-xl p-4 bg-base-100 hover:bg-base-200 transition-colors"
            >
              <h4 className="font-semibold mb-3 blur-sm opacity-50 select-none">
                {author ? author.name : "Unknown"}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {submission.cards.map((card) => (
                  <SubmissionCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
