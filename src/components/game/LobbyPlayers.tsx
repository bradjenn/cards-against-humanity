import type { GamePlayer } from "@/types/db";

export function LobbyPlayers({ players }: { players: GamePlayer[] }) {
  return (
    <div className="card bg-base-100 border p-6">
      <h2 className="text-xl font-bold mb-3">Players</h2>

      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="border-b py-2 flex justify-between">
            <span>{p.name}</span>
            {!p.is_connected && (
              <span className="badge badge-xs badge-warning">disconnected</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
