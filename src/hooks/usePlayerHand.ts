import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPlayerHand } from "@/queries/handQueries";
import type { Card } from "@/types/db";

export function usePlayerHand({
  gameId,
  playerId,
  roundId,
  enabled = true,
}: {
  gameId: string;
  playerId: string | null;
  roundId: string;
  enabled?: boolean;
}) {
  const supabase = useSupabase();

  const [hand, setHand] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (!playerId) return;
    if (!gameId) return;
    if (!roundId) return;

    const pid = playerId;
    let cancelled = false;

    async function loadHand() {
      setLoading(true);
      try {
        const cards = await getPlayerHand(supabase, gameId, pid);

        if (!cancelled) {
          setHand(cards);
        }
      } catch (err) {
        console.error("Failed to load player hand", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setHand([]);
    loadHand();

    return () => {
      cancelled = true;
    };
  }, [supabase, gameId, playerId, roundId, enabled]);

  return {
    hand,
    loading,
  };
}
