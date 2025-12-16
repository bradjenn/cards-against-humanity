import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { fetchGameBySlug } from "@/services/gameService";
import type { Game } from "@/types/db";

export function useGame(supabase: SupabaseClient, slug: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchGameBySlug(supabase, slug);
      if (!cancelled) {
        setGame(result);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, slug]);

  return { game, loading };
}
