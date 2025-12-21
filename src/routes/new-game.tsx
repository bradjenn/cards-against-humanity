import type { SupabaseClient } from "@supabase/supabase-js";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Package } from "lucide-react";
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
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="bg-black text-white p-8 rounded-lg border-4 border-black">
          <h1 className="text-4xl font-bold">Create New Game</h1>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-8 flex flex-col items-center space-y-4">
          <div className="loading loading-spinner loading-lg" />
          <div className="text-lg font-semibold">Loading card packs...</div>
        </div>
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

  function toggleAllPacks() {
    if (selectedPacks.length === packs.length) {
      // All selected, deselect all
      setSelectedPacks([]);
    } else {
      // Not all selected, select all
      setSelectedPacks(packs.map((p) => p.id));
    }
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
    <div className="max-w-4xl mx-auto p-8 pb-32 space-y-8">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-black hover:underline font-semibold"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="bg-black text-white p-8 rounded-lg border-4 border-black">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Create New Game</h1>
        <p className="text-lg opacity-90">
          Set up your game and invite your friends
        </p>
      </div>

      {/* Player Name Section */}
      <div className="bg-white border-2 border-black rounded-lg p-6 space-y-3">
        <label htmlFor="username" className="block text-lg font-bold">
          Your Name
        </label>
        {isEditingName ? (
          <input
            id="username"
            className="input input-bordered w-full border-2 border-black rounded-sm"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded border-2 border-black">
            <div className="text-xl font-bold">{playerName}</div>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="btn btn-sm border-2 border-black rounded-sm bg-white hover:bg-gray-100"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Pack Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Select Card Packs</h2>
          </div>
          <button
            type="button"
            onClick={toggleAllPacks}
            className="btn btn-sm border-2 border-black rounded-sm bg-white hover:bg-gray-100 font-semibold"
          >
            {selectedPacks.length === packs.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {packs.map((pack) => {
            const selected = selectedPacks.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => togglePack(pack.id)}
                className={cn(
                  "card p-5 border-2 transition-all rounded-lg text-left flex flex-row items-center justify-between",
                  selected
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black hover:bg-gray-50",
                )}
              >
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1">{pack.name}</div>
                  <div
                    className={cn(
                      "text-sm",
                      selected ? "opacity-75" : "opacity-60",
                    )}
                  >
                    {pack.white_card_count} white cards •{" "}
                    {pack.black_card_count} black cards
                  </div>
                </div>
                {selected && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-30">
        <div className="max-w-4xl mx-auto px-8 py-3">
          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3 rounded-lg font-semibold text-center">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            {selectedPacks.length > 0 ? (
              <div className="flex gap-3 text-center">
                <div className="bg-white border-2 border-black rounded-lg p-3 min-w-20">
                  <div className="font-bold text-xl">
                    {selectedPacks.length}
                  </div>
                  <div className="text-xs opacity-60">
                    {selectedPacks.length === 1 ? "Pack" : "Packs"}
                  </div>
                </div>
                <div className="bg-white border-2 border-black rounded-lg p-3 min-w-20">
                  <div className="font-bold text-xl">{whiteCardCount}</div>
                  <div className="text-xs opacity-60">White</div>
                </div>
                <div className="bg-black text-white border-2 border-black rounded-lg p-3 min-w-20">
                  <div className="font-bold text-xl">{blackCardCount}</div>
                  <div className="text-xs opacity-75">Black</div>
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-60">
                Select at least one pack to continue
              </div>
            )}

            <button
              type="button"
              className="btn btn-lg rounded-sm bg-black text-white border-2 border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600"
              disabled={loading}
              onClick={handleCreateGame}
            >
              {loading ? "Creating…" : "Create Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
