import type { Card } from "@/types/db";

export function JudgeReveal({
  revealedSubmissions,
  totalSubmissions,
  onRevealNext,
  isRevealing,
}: {
  revealedSubmissions: {
    submissionId: string;
    cards: Card[];
  }[];
  totalSubmissions: number;
  onRevealNext: () => void;
  isRevealing: boolean;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">
        Revealing submissions ({revealedSubmissions.length} / {totalSubmissions}
        )
      </h3>

      <div className="space-y-4">
        {revealedSubmissions.map((submission, index) => (
          <div key={submission.submissionId} className="border rounded-xl p-4">
            <h4 className="font-semibold mb-2">Submission {index + 1}</h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {submission.cards.map((card) => (
                <div
                  key={card.id}
                  className="card bg-base-100 border p-3 text-sm"
                >
                  {card.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={isRevealing}
        onClick={onRevealNext}
      >
        Reveal next submission
      </button>
    </div>
  );
}
