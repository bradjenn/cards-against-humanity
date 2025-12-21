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
    <div className="alert alert-info sticky top-0 z-20 rounded-none border-b shadow-sm">
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <span className="font-semibold">
          📜 Round {round.round_number} Summary (Current round:{" "}
          {game.round_number})
        </span>
        <button
          type="button"
          onClick={handleOnGoToCurrentRound}
          className="btn btn-sm btn-primary"
        >
          Go to Current Round
        </button>
      </div>
    </div>
  );
}
