import { canStartGame } from "@/domain/rules";
import type { GamePlayer } from "@/types/db";

export function HostControls({
  players,
  onStartGame,
  starting = false,
}: {
  players: GamePlayer[];
  onStartGame: () => void;
  starting?: boolean;
}) {
  const enoughPlayers = canStartGame(players);

  return (
    <div className="card bg-base-100 border p-6 space-y-4">
      <h2 className="text-xl font-bold">Host Controls</h2>

      {!enoughPlayers && (
        <div className="alert alert-warning text-sm">
          You need at least 3 players to start the game.
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={!enoughPlayers || starting}
        onClick={onStartGame}
      >
        {starting ? "Starting…" : "Start Game"}
      </button>
    </div>
  );
}
