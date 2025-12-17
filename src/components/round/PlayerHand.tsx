import { cn } from "@/lib/utils";
import type { Card } from "@/types/db";

export function PlayerHand({
  cards,
  selectedCardIds = [],
  submittedCardIds = [],
  onToggleCard,
  disabled = false,
  playerScore,
}: {
  cards: Card[];
  selectedCardIds?: string[];
  submittedCardIds?: string[];
  onToggleCard?: (cardId: string) => void;
  disabled?: boolean;
  playerScore?: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Your Hand</h3>
        {playerScore !== undefined && (
          <div className="text-lg font-bold">
            Score: <span className="text-primary">{playerScore}</span>
          </div>
        )}
      </div>

      <div className="grid pb-24 grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isSubmitted = submittedCardIds.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggleCard?.(card.id)}
              className={cn(
                "bg-white border-2 flex items-start rounded-lg shadow-sm min-h-60 p-3 text-sm text-left font-bold cursor-pointer transition-all",
                isSubmitted && "border-4 border-primary bg-blue-50",
                isSelected &&
                  !isSubmitted &&
                  "border-primary outline-3 bg-neutral-100 shadow-md",
                !isSelected && !isSubmitted && "border-black",
                disabled ? "cursor-not-allowed opacity-80" : "hover:shadow-md",
              )}
            >
              {card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
