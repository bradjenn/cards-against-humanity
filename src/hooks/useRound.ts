import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Round } from "@/types/db";

/**
 * Unified round hook that manages round state and submission tracking.
 * Uses payload.new directly for updates instead of re-fetching.
 */
export function useRound({ initialRound }: { initialRound: Round }) {
  const supabase = useSupabase();

  const [round, setRound] = useState<Round>(initialRound);
  // Track submitted player IDs in a Set for efficient unique counting
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch current submitted player IDs on mount to build the Set
  useEffect(() => {
    let cancelled = false;

    async function fetchSubmittedPlayers() {
      const { data } = await supabase
        .from("submissions")
        .select("player_id")
        .eq("round_id", initialRound.id);

      if (data && !cancelled) {
        const playerIds = new Set(data.map((r) => r.player_id));
        setSubmittedPlayerIds(playerIds);
      }
    }

    fetchSubmittedPlayers();

    return () => {
      cancelled = true;
    };
  }, [supabase, initialRound.id]);

  // Keep round in sync if loader data changes
  useEffect(() => {
    setRound(initialRound);
  }, [initialRound]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!round.id) return;

    const channel = supabase
      .channel(`round-${round.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `round_id=eq.${round.id}`,
        },
        (payload) => {
          // Use payload directly - add player_id to Set instead of re-fetching
          const newSubmission = payload.new as { player_id: string };
          setSubmittedPlayerIds(
            (prev) => new Set([...prev, newSubmission.player_id]),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rounds",
          filter: `id=eq.${round.id}`,
        },
        (payload) => {
          // Use payload.new directly - no re-fetch needed
          setRound(payload.new as Round);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, round.id]);

  return {
    round,
    submittedPlayerIds,
    submissionsCount: submittedPlayerIds.size,
  };
}
