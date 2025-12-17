import type { SupabaseClient } from "@supabase/supabase-js";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { useSupabase } from "@/components/SupabaseProvider";
import { cn } from "@/lib/utils";
import { newGameLoader } from "@/loaders/newGameLoader";
import { createGame } from "@/server/game/createGame";

export const Route = createFileRoute("/new-game")({
  loader: newGameLoader,
  component: NewGamePage,
  pendingComponent: () => (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="loading loading-spinner loading-lg" />
        <div className="text-lg">Loading card packs...</div>
      </div>
    </div>
  ),
});

function NewGamePage() {
  const supabase = useSupabase() as SupabaseClient;
  const navigate = useNavigate();
  const { packs } = Route.useLoaderData();

  const [playerName, setPlayerName] = useState("");
  const [isEditingName, setIsEditingName] = useState(true);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for existing player on mount (client-side only)
  useEffect(() => {
    const playerId = window.localStorage.getItem("cah_player_id");
    if (playerId) {
      supabase
        .from("game_players")
        .select("name")
        .eq("id", playerId)
        .single()
        .then(({ data }) => {
          if (data?.name) {
            setPlayerName(data.name);
            setIsEditingName(false);
          }
        });
    }
  }, [supabase]);

  // Calculate total card counts from selected packs
  const whiteCardCount = packs
    .filter((pack) => selectedPacks.includes(pack.id))
    .reduce((sum, pack) => sum + pack.white_card_count, 0);

  const blackCardCount = packs
    .filter((pack) => selectedPacks.includes(pack.id))
    .reduce((sum, pack) => sum + pack.black_card_count, 0);

  function togglePack(id: string) {
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  async function handleCreateGame() {
    setError(null);

    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }

    if (selectedPacks.length === 0) {
      setError("Select at least one pack");
      return;
    }

    setLoading(true);

    try {
      const slug = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: "-",
        style: "lowerCase",
      });

      const { host } = await createGame(supabase, {
        slug,
        packs: selectedPacks,
        hostName: playerName,
      });

      window.localStorage.setItem("cah_player_id", host.id);

      // Use navigate instead of window.location.href for SPA navigation
      navigate({
        to: "/game/$slug",
        params: { slug },
      });
    } catch (err) {
      console.error(err);
      setError("Could not create game. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 pb-32 space-y-8">
      <h1 className="text-5xl font-black uppercase">New Game</h1>

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-base-content/70"
        >
          Your Name
        </label>
        {isEditingName ? (
          <input
            id="username"
            className="input input-bordered w-full"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{playerName}</div>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="btn btn-ghost btn-sm"
            >
              Change
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Select Packs</h2>

        <div className="grid gap-3">
          {packs.map((pack) => {
            const selected = selectedPacks.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => togglePack(pack.id)}
                className={cn(
                  "card p-4 border transition",
                  selected
                    ? "bg-primary text-primary-content border-primary"
                    : "bg-base-100 border-neutral"
                )}
              >
                {pack.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t p-4 space-y-3 z-30">
        {error && <div className="alert alert-error">{error}</div>}

        {selectedPacks.length > 0 && (
          <div className="flex justify-around text-sm text-center">
            <div>
              <div className="font-bold text-lg">{selectedPacks.length}</div>
              <div className="text-base-content/60">
                {selectedPacks.length === 1 ? "Pack" : "Packs"}
              </div>
            </div>
            <div>
              <div className="font-bold text-lg">{whiteCardCount}</div>
              <div className="text-base-content/60">White Cards</div>
            </div>
            <div>
              <div className="font-bold text-lg">{blackCardCount}</div>
              <div className="text-base-content/60">Black Cards</div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={loading}
          onClick={handleCreateGame}
        >
          {loading ? "Creating…" : "Create Game"}
        </button>
      </div>
    </div>
  );
}
