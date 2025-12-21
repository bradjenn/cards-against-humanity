import { useEffect, useState } from "react";
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
  const [submittedCardIds, setSubmittedCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial submitted cards
  useEffect(() => {
    if (!playerId) {
      setSubmittedCardIds([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSubmittedCards() {
      setLoading(true);
      try {
        const cardIds = await getPlayerSubmittedCardIds(supabase, {
          roundId,
          playerId: playerId,
        });
        if (!cancelled) {
          setSubmittedCardIds(cardIds);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSubmittedCards();

    return () => {
      cancelled = true;
    };
  }, [supabase, roundId, playerId]);

  // Subscribe to own submissions - use payload directly
  useEffect(() => {
    if (!playerId) return;

    const channel = supabase
      .channel(`my-submissions-${roundId}-${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `round_id=eq.${roundId}`,
        },
        (payload) => {
          const submission = payload.new as {
            player_id: string;
            card_id: string;
          };
          // Only update if this is our submission
          if (submission.player_id === playerId) {
            setSubmittedCardIds((prev) => [...prev, submission.card_id]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roundId, playerId]);

  return {
    submittedCardIds,
    hasSubmitted: submittedCardIds.length > 0,
    loading,
  };
}
