import { useCallback, useState } from "react";
import { advanceRound } from "@/server/round/advanceRound";

export function useAdvanceRound() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async ({ gameId, roundId }: { gameId: string; roundId: string }) => {
      setIsPending(true);
      try {
        return await advanceRound({ data: { gameId, roundId } });
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutateAsync, isPending };
}
