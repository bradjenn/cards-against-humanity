import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pickRoundWinner } from "@/server/round/pickRoundWinner";

export function usePickWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, winningPlayerId }: { roundId: string; winningPlayerId: string }) =>
      pickRoundWinner({ data: { roundId, winningPlayerId } }),
    onSuccess: () => {
      // Invalidate round and players queries to get updated scores
      queryClient.invalidateQueries({ queryKey: ["round"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
