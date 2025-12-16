import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Game } from "@/types/db";

export function useGameRealtime(initialGame: Game) {
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
          setGame(payload.new as Game);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, game.id]);

  return game;
}
