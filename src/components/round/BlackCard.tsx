import { useMemo } from "react";
import type { Card } from "@/types/db";

function normalizeCardText(cardText: string, isStartOfSentence: boolean): string {
  // Remove trailing punctuation (., !, ?, etc.)
  let normalized = cardText.replace(/[.!?]+$/, "").trim();

  // Lowercase first letter unless it's the start of a sentence
  if (!isStartOfSentence && normalized.length > 0) {
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  }

  return normalized;
}

function fillBlanks(text: string, selectedCards: Card[]): React.ReactNode {
  // Split by blank pattern (one or more underscores)
  const parts = text.split(/_{1,}/);

  // If there are no blanks, append the selected cards to the end
  if (parts.length === 1) {
    const result: React.ReactNode[] = [<span key="text">{text}</span>];

    selectedCards.forEach((card, index) => {
      // Add space before card
      result.push(<span key={`space-${index}`}> </span>);

      // When appending (no blanks), keep original capitalization but remove trailing punctuation
      const normalizedText = card.text.replace(/[.!?]+$/, "").trim();
      result.push(<span key={`card-${index}`}>{normalizedText}</span>);

      // Add period if this is the last card and text doesn't end with punctuation
      if (index === selectedCards.length - 1 && !/[.!?]\s*$/.test(text)) {
        result.push(<span key="period">.</span>);
      }
    });

    return result;
  }

  const result: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    // Add the text part
    if (part) {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }

    // Add the filled blank if we have a card for it and it's not the last part
    if (index < parts.length - 1) {
      const card = selectedCards[index];
      if (card) {
        // Determine if this blank starts a sentence
        // It's the start if: the black card starts with the blank (no text before it)
        // OR the previous part ends with sentence-ending punctuation
        const prevPart = parts[index];
        const isStartOfSentence =
          (index === 0 && prevPart.trim() === "") ||
          /[.!?]\s*$/.test(prevPart);

        const normalizedText = normalizeCardText(card.text, isStartOfSentence);

        result.push(<span key={`card-${index}`}>{normalizedText}</span>);
      } else {
        // Show blank if no card selected yet
        result.push(<span key={`blank-${index}`}>_____</span>);
      }
    }
  });

  return result;
}

export function BlackCard({
  card,
  selectedCards = [],
}: {
  card: Card;
  selectedCards?: Card[];
}) {
  const displayText = useMemo(() => {
    return selectedCards.length > 0 ? fillBlanks(card.text, selectedCards) : card.text;
  }, [card.text, selectedCards]);

  return (
    <div className="bg-neutral text-neutral-content p-8 rounded-lg shadow-md">
      <p className="text-lg font-bold">{displayText}</p>
    </div>
  );
}
