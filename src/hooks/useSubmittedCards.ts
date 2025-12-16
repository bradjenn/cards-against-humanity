import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPlayerSubmittedCardIds } from "@/queries/submissionQueries";

export function useSubmittedCards({
  roundId,
  playerId,
}: {
  roundId: string;
  playerId: string | null;
}) {
  const supabase = useSupabase();
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!playerId) return;

    setLoading(true);
    try {
      const ids = await getPlayerSubmittedCardIds(supabase, {
        roundId,
        playerId,
      });
      setCardIds(ids);
    } finally {
      setLoading(false);
    }
  }, [supabase, roundId, playerId]);

  useEffect(() => {
    if (!playerId) return;

    fetchCards();
  }, [playerId, fetchCards]);

  return {
    submittedCardIds: cardIds,
    hasSubmitted: cardIds.length > 0,
    loading,
    refresh: fetchCards,
  };
}
