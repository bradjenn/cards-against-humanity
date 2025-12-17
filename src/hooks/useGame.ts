import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGameBySlug } from "@/queries/gameQueries";

export function useGame(supabase: SupabaseClient, slug: string) {
  const { data: game, isLoading: loading } = useQuery({
    queryKey: ["game", slug],
    queryFn: () => getGameBySlug(supabase, slug),
  });

  return { game: game ?? null, loading };
}
