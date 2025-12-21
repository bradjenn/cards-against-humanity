import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getPlayersForGame } from "@/queries/playerQueries";
import type { GamePlayer } from "@/types/db";

export function usePlayers(supabase: SupabaseClient, gameId: string | null) {
  const [players, setPlayers] = useState<GamePlayer[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (!gameId) {
      setPlayers([]);
      return;
    }

    let cancelled = false;

    async function loadPlayers() {
      const data = await getPlayersForGame(supabase, gameId);
      if (!cancelled) {
        setPlayers(data);
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, [supabase, gameId]);

  // Subscribe to realtime updates - use payload directly instead of re-fetching
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`players-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newPlayer = payload.new as GamePlayer;
          setPlayers((prev) =>
            [...prev, newPlayer].sort(
              (a, b) =>
                new Date(a.joined_at).getTime() -
                new Date(b.joined_at).getTime(),
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const updated = payload.new as GamePlayer;
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setPlayers((prev) => prev.filter((p) => p.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, gameId]);

  return players;
}
