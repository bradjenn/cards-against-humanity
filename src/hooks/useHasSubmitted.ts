import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { hasPlayerSubmitted } from "@/queries/submissionQueries";

export function useHasSubmitted({
  roundId,
  playerId,
  enabled = true,
}: {
  roundId: string;
  playerId: string | null;
  enabled?: boolean;
}) {
  const supabase = useSupabase();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!playerId) return;

    setLoading(true);
    try {
      const result = await hasPlayerSubmitted(supabase, {
        roundId,
        playerId,
      });
      setHasSubmitted(result);
    } finally {
      setLoading(false);
    }
  }, [supabase, roundId, playerId]);

  useEffect(() => {
    if (!enabled || !playerId) return;
    check();
  }, [enabled, playerId, check]);

  return {
    hasSubmitted,
    loading,
    refresh: check,
  };
}
