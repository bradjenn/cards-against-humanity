import type { Card } from "@/types/db";

export function BlackCardBanner({ card }: { card: Card }) {
  return (
    <div className="sticky top-0 border-b bg-white z-10">
      <div className="flex flex-col gap-3 max-w-4xl px-8 py-4 mx-auto">
        <div className="bg-neutral text-neutral-content p-8 rounded-lg shadow-md">
          <p className="text-lg font-bold">{card.text}</p>
        </div>
      </div>
    </div>
  );
}
