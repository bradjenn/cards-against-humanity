import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advanceRound } from "@/server/round/advanceRound";

export function useAdvanceRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, roundId }: { gameId: string; roundId: string }) =>
      advanceRound({ data: { gameId, roundId } }),
    onSuccess: (_data, variables) => {
      // Invalidate game, round, and player hand queries
      queryClient.invalidateQueries({ queryKey: ["game"] });
      queryClient.invalidateQueries({ queryKey: ["round"] });
      queryClient.invalidateQueries({ queryKey: ["playerHand"] });
      queryClient.invalidateQueries({ queryKey: ["submissionCount"] });
    },
  });
}
