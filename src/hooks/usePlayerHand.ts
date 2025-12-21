import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPlayerHand } from "@/queries/handQueries";
import type { Card, PlayerHand } from "@/types/db";

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
  const [loading, setLoading] = useState(true);

  // Fetch initial hand
  useEffect(() => {
    if (!enabled || !playerId || !gameId || !roundId) {
      setHand([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchHand() {
      setLoading(true);
      try {
        const cards = await getPlayerHand(supabase, gameId, playerId!);
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

    fetchHand();

    return () => {
      cancelled = true;
    };
  }, [supabase, enabled, playerId, gameId, roundId]);

  // Subscribe to hand changes
  useEffect(() => {
    if (!enabled || !playerId || !gameId) return;

    const channel = supabase
      .channel(`hand-${gameId}-${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "player_hands",
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          // Remove card directly from state - no fetch needed
          const deleted = payload.old as PlayerHand;
          setHand((prev) => prev.filter((card) => card.id !== deleted.card_id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_hands",
          filter: `player_id=eq.${playerId}`,
        },
        async (payload) => {
          // Fetch only the new card's details
          const inserted = payload.new as PlayerHand;
          const { data: card } = await supabase
            .from("cards")
            .select("*")
            .eq("id", inserted.card_id)
            .single();

          if (card) {
            setHand((prev) => [...prev, card as Card]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, gameId, playerId, enabled]);

  return {
    hand,
    loading,
  };
}
