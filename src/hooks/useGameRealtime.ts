import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Game } from "@/types/db";

export function useGameRealtime(initialGame: Game) {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const [game, setGame] = useState(initialGame);

  useEffect(() => {
    setGame(initialGame);
  }, [initialGame]);

  useEffect(() => {
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
          const updatedGame = payload.new as Game;
          setGame(updatedGame);
          // Invalidate game query to keep cache in sync
          queryClient.invalidateQueries({ queryKey: ["game", updatedGame.slug] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, game.id, queryClient]);

  return game;
}
