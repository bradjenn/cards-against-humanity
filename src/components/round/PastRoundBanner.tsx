import { ArrowRight } from "lucide-react";
import type { Game, Round } from "@/types/db";

export function PastRoundBanner({
  game,
  round,
  handleOnGoToCurrentRound,
}: {
  game: Game;
  round: Round;
  handleOnGoToCurrentRound: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 bg-base-200/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between max-w-4xl px-8 py-3 mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-base-content/70">
            Viewing Round {round.round_number}
          </span>
          <span className="text-sm text-base-content/50">
            (Game is on round {game.round_number})
          </span>
        </div>
        <button
          type="button"
          onClick={handleOnGoToCurrentRound}
          className="btn btn-sm btn-outline rounded-sm bg-white"
        >
          Current Round
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
