import type { Card } from "@/types/db";

export function SubmissionCard({ card }: { card: Card }) {
  return (
    <div className="bg-white border-2 border-black rounded-lg shadow-sm h-52 p-3 text-sm text-left font-bold hover:shadow-md transition-shadow">
      {card.text}
    </div>
  );
}
