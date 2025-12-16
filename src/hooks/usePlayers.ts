import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { fetchPlayersForGame } from "@/services/playerService";
import type { GamePlayer } from "@/types/db";

export function usePlayers(supabase: SupabaseClient, gameId: string | null) {
  const [players, setPlayers] = useState<GamePlayer[]>([]);

  useEffect(() => {
    if (!gameId) return;

    async function loadPlayers(id: string) {
      const data = await fetchPlayersForGame(supabase, id);
      setPlayers(data);
    }

    loadPlayers(gameId);

    const channel = supabase
      .channel(`players-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        () => loadPlayers(gameId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, gameId]);

  return players;
}
