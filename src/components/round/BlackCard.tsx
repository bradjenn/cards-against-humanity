import type { Card } from "@/types/db";

export function BlackCard({ card }: { card: Card }) {
  return (
    <div className="bg-neutral text-neutral-content p-8 rounded-lg shadow-md">
      <p className="text-lg font-bold">{card.text}</p>
    </div>
  );
}
