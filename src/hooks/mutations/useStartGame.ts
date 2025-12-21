import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import { startGame } from "@/server/game/startGame";

export function useStartGame(supabase: SupabaseClient) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async ({
      gameId,
      whiteCardsPerPlayer,
    }: {
      gameId: string;
      whiteCardsPerPlayer: number;
    }) => {
      setIsPending(true);
      try {
        return await startGame(supabase, { gameId, whiteCardsPerPlayer });
      } finally {
        setIsPending(false);
      }
    },
    [supabase],
  );

  return { mutateAsync, isPending };
}
