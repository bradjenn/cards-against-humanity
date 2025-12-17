import type { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPlayersForGame } from "@/queries/playerQueries";
import type { GamePlayer } from "@/types/db";

export function usePlayers(supabase: SupabaseClient, gameId: string | null) {
  const queryClient = useQueryClient();
  const [players, setPlayers] = useState<GamePlayer[]>([]);

  useEffect(() => {
    if (!gameId) return;

    async function loadPlayers(id: string) {
      const data = await getPlayersForGame(supabase, id);
      setPlayers(data);
      // Invalidate players query to keep cache in sync
      queryClient.invalidateQueries({ queryKey: ["players", id] });
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
  }, [supabase, gameId, queryClient]);

  return players;
}
