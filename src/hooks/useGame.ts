import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchGameBySlug } from "@/services/gameService";

export function useGame(supabase: SupabaseClient, slug: string) {
  const { data: game, isLoading: loading } = useQuery({
    queryKey: ["game", slug],
    queryFn: () => fetchGameBySlug(supabase, slug),
  });

  return { game: game ?? null, loading };
}
