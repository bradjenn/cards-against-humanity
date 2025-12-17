import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Round } from "@/types/db";

export function useRoundRealtime({
  initialRound,
  initialSubmissionsCount,
}: {
  initialRound: Round;
  initialSubmissionsCount: number;
}) {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const [round, setRound] = useState<Round>(initialRound);
  const [submissionsCount, setSubmissionsCount] = useState(
    initialSubmissionsCount,
  );

  // Keep round in sync if loader data changes
  useEffect(() => {
    setRound(initialRound);
    setSubmissionsCount(initialSubmissionsCount);
  }, [initialRound, initialSubmissionsCount]);

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
        async () => {
          const { data } = await supabase
            .from("submissions")
            .select("player_id")
            .eq("round_id", round.id);

          if (data) {
            const uniquePlayers = new Set(data.map((r) => r.player_id));
            setSubmissionsCount(uniquePlayers.size);
            // Invalidate submissionCount and submittedCards queries
            queryClient.invalidateQueries({ queryKey: ["submissionCount", round.id] });
            queryClient.invalidateQueries({ queryKey: ["submittedCards", round.id] });
          }
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
          const updatedRound = payload.new as Round;
          setRound(updatedRound);
          // Invalidate round query to keep cache in sync
          queryClient.invalidateQueries({ queryKey: ["round"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, round.id, queryClient]);

  return {
    round,
    submissionsCount,
  };
}
