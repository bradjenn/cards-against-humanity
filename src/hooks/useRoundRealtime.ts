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
    submissionsCount,
  };
}
