import type { SupabaseClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { useSupabase } from "@/components/SupabaseProvider";
import { createGame } from "@/server/game/createGame";

export const Route = createFileRoute("/new-game")({
  component: NewGamePage,
});

function NewGamePage() {
  const supabase = useSupabase() as SupabaseClient;

  const [playerName, setPlayerName] = useState("");
  const [availablePacks, setAvailablePacks] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("packs")
      .select("id, name")
      .then(({ data }) => {
        setAvailablePacks((data ?? []) as { id: string; name: string }[]);
      });
  }, [supabase]);

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
      window.location.href = `/game/${slug}`;
    } catch (err) {
      console.error(err);
      setError("Could not create game. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-5xl font-black uppercase">New Game</h1>

      <div className="form-control">
        <label className="label font-semibold">Your Name</label>
        <input
          className="input input-bordered"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Select Packs</h2>

        <div className="grid gap-3">
          {availablePacks.map((pack) => {
            const selected = selectedPacks.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => togglePack(pack.id)}
                className={`card p-4 border transition
                  ${
                    selected
                      ? "bg-primary text-primary-content border-primary"
                      : "bg-base-100 border-neutral"
                  }
                `}
              >
                {pack.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button
        className="btn btn-primary w-full"
        disabled={loading}
        onClick={handleCreateGame}
      >
        {loading ? "Creating…" : "Create Game"}
      </button>
    </div>
  );
}
