import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getGameBySlug } from "@/queries/gameQueries";
import type { Game } from "@/types/db";

/**
 * Unified game hook that fetches and/or subscribes to realtime updates.
 *
 * @param slugOrGame - Either a slug string (fetches game) or a Game object (uses as initial data)
 * @returns { game, loading } - Current game state and loading status
 */
// Overload: When Game object is passed, game is guaranteed non-null
export function useGame(initialGame: Game): { game: Game; loading: boolean };
// Overload: When slug string is passed, game may be null while loading
export function useGame(slug: string): { game: Game | null; loading: boolean };
// Implementation
export function useGame(slugOrGame: string | Game): {
  game: Game | null;
  loading: boolean;
} {
  const supabase = useSupabase();
  const isInitialData = typeof slugOrGame !== "string";

  const [game, setGame] = useState<Game | null>(
    isInitialData ? slugOrGame : null,
  );
  const [loading, setLoading] = useState(!isInitialData);

  // Sync with initial data if it changes (e.g., from loader)
  useEffect(() => {
    if (isInitialData) {
      setGame(slugOrGame);
    }
  }, [isInitialData, slugOrGame]);

  // Fetch game by slug if not provided as initial data
  useEffect(() => {
    if (isInitialData) return;

    const slug = slugOrGame;
    let cancelled = false;

    async function fetchGame() {
      setLoading(true);
      try {
        const data = await getGameBySlug(supabase, slug);
        if (!cancelled) {
          setGame(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchGame();

    return () => {
      cancelled = true;
    };
  }, [supabase, slugOrGame, isInitialData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          // Use payload.new directly - no re-fetch needed
          setGame(payload.new as Game);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, game?.id]);

  return { game, loading };
}
