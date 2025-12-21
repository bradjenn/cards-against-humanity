import { useCallback, useState } from "react";
import { pickRoundWinner } from "@/server/round/pickRoundWinner";

export function usePickWinner() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async ({
      roundId,
      winningPlayerId,
    }: {
      roundId: string;
      winningPlayerId: string;
    }) => {
      setIsPending(true);
      try {
        return await pickRoundWinner({ data: { roundId, winningPlayerId } });
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutateAsync, isPending };
}
