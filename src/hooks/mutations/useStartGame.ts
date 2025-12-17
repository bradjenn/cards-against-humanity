import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startGame } from "@/server/game/startGame";

export function useStartGame(supabase: SupabaseClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, whiteCardsPerPlayer }: { gameId: string; whiteCardsPerPlayer: number }) =>
      startGame(supabase, { gameId, whiteCardsPerPlayer }),
    onSuccess: () => {
      // Invalidate game query to get updated status
      queryClient.invalidateQueries({ queryKey: ["game"] });
      queryClient.invalidateQueries({ queryKey: ["playerHand"] });
    },
  });
}
