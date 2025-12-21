import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GamePlayer } from "@/types/db";

export function GameInfoPanel({
  players,
  roundNumber,
  isOpen,
  onClose,
}: {
  players: GamePlayer[];
  roundNumber: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-base-100 border-t z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
        style={{ maxHeight: "70vh" }}
      >
        <div
          className="py-6 px-8 space-y-6 overflow-y-auto max-w-4xl mx-auto"
          style={{ maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Game Info</h2>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-circle btn-ghost"
              aria-label="Close leaderboard"
            >
              <ChevronDown />
            </button>
          </div>

          {/* Round Info */}
          <div className="card bg-base-200 p-4">
            <div className="text-center">
              <div className="text-sm text-base-content/60">Current Round</div>
              <div className="text-3xl font-bold">{roundNumber}</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold">Leaderboard</h3>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => {
                const isFirst = index === 0;
                const isConnected = player.is_connected;

                return (
                  <div
                    key={player.id}
                    className={cn(
                      "card p-4 flex flex-row justify-between items-center",
                      isFirst
                        ? "bg-primary text-primary-content"
                        : "bg-base-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          !isFirst && "text-base-content/50",
                        )}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{player.name}</div>
                          {!isConnected && (
                            <span className="badge badge-sm badge-ghost">
                              Disconnected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFirst && <span className="text-2xl">🏆</span>}
                      <div className="text-2xl font-bold">{player.score}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
