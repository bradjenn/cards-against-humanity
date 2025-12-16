import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getCardsByIds } from "@/queries/cardQueries";
import {
  getSubmissionsForJudge,
  type JudgeSubmission,
} from "@/queries/judgeQueries";
import type { Card } from "@/types/db";

export function useJudgeSubmissions(roundId: string) {
  const supabase = useSupabase();

  const [submissions, setSubmissions] = useState<JudgeSubmission[]>([]);
  const [cardsByPlayer, setCardsByPlayer] = useState<Record<string, Card[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roundId) return;

    setSubmissions([]);
    setCardsByPlayer({});
  }, [roundId]);

  /**
   * Shared loader (used by initial load + realtime)
   */
  const load = useCallback(async () => {
    setLoading(true);

    // 1 Load submissions
    const subs = await getSubmissionsForJudge(supabase, roundId);
    setSubmissions(subs);

    // 2 Resolve cards
    const allCardIds = subs.flatMap((s) => s.card_ids);

    if (allCardIds.length === 0) {
      setCardsByPlayer({});
      setLoading(false);
      return;
    }

    const cards = await getCardsByIds(supabase, allCardIds);

    const cardMap = new Map(cards.map((c) => [c.id, c]));

    const grouped: Record<string, Card[]> = {};
    for (const sub of subs) {
      grouped[sub.player_id] = sub.card_ids
        .map((id) => cardMap.get(id))
        .filter(Boolean) as Card[];
    }

    setCardsByPlayer(grouped);
    setLoading(false);
  }, [supabase, roundId]);

  /**
   * Initial load
   */
  useEffect(() => {
    let cancelled = false;

    async function safeLoad() {
      if (!cancelled) {
        await load();
      }
    }

    safeLoad();

    return () => {
      cancelled = true;
    };
  }, [load]);

  /**
   * Realtime subscription
   */
  useEffect(() => {
    const channel = supabase
      .channel(`judge-submissions-${roundId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          // Any change → re-fetch
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roundId, load]);

  return {
    submissions,
    cardsByPlayer,
    loading,
  };
}
