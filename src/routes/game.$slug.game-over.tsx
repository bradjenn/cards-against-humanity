import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useSupabase } from "@/components/SupabaseProvider";
import type { GamePlayer } from "@/types/db";

export const Route = createFileRoute("/game/$slug/game-over")({
  component: GameOverPage,
});

function GameOverPage() {
  const { slug } = Route.useParams();
  const supabase = useSupabase();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGameData() {
      // Fetch game to get the game ID
      const { data: game } = await supabase
        .from("games")
        .select("id, status")
        .eq("slug", slug)
        .single();

      if (!game) {
        navigate({ to: "/" });
        return;
      }

      // Redirect if game isn't actually finished
      if (game.status !== "FINISHED") {
        navigate({
          to: "/game/$slug",
          params: { slug },
        });
        return;
      }

      // Fetch players sorted by score
      const { data: playersData } = await supabase
        .from("game_players")
        .select("*")
        .eq("game_id", game.id)
        .order("score", { ascending: false });

      setPlayers((playersData ?? []) as GamePlayer[]);
      setLoading(false);
    }

    loadGameData();
  }, [supabase, slug, navigate]);

  useEffect(() => {
    // Celebrate the winner with confetti
    if (players.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [players]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div>Loading results...</div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div>No players found.</div>
      </div>
    );
  }

  const winner = players[0];
  const rest = players.slice(1);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black uppercase">Game Over!</h1>
        <div className="text-4xl">🏆</div>
      </div>

      <div className="card bg-primary text-primary-content p-8">
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold">Winner</div>
          <div className="text-5xl font-black">{winner.name}</div>
          <div className="text-3xl">{winner.score} points</div>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Final Scores</h2>
          <div className="space-y-2">
            {rest.map((player, index) => (
              <div
                key={player.id}
                className="card bg-base-200 p-4 flex flex-row justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-base-content/50">
                    #{index + 2}
                  </div>
                  <div className="text-xl font-semibold">{player.name}</div>
                </div>
                <div className="text-2xl font-bold">{player.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => navigate({ to: "/new-game" })}
        >
          New Game
        </button>
        <button
          type="button"
          className="btn btn-outline flex-1"
          onClick={() => navigate({ to: "/" })}
        >
          Home
        </button>
      </div>
    </div>
  );
}
