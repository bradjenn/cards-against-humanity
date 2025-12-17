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
              className={`
                card border-2 h-52 rounded-sm p-3 text-sm shadow font-bold cursor-pointer text-left transition
                ${
                  isSubmitted
                    ? "border-4 border-primary bg-base-200"
                    : isSelected
                      ? "border-primary bg-base-300"
                      : "bg-base-100"
                }
                ${disabled ? "cursor-not-allowed opacity-80" : "hover:shadow"}
              `}
            >
              {card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
