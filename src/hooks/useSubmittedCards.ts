import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPlayerSubmittedCardIds } from "@/queries/submissionQueries";

export function useSubmittedCards({
  roundId,
  playerId,
}: {
  roundId: string;
  playerId: string | null;
}) {
  const supabase = useSupabase();

  const { data: submittedCardIds = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["submittedCards", roundId, playerId],
    queryFn: () => getPlayerSubmittedCardIds(supabase, { roundId, playerId: playerId! }),
    enabled: !!playerId,
  });

  return {
    submittedCardIds,
    hasSubmitted: submittedCardIds.length > 0,
    loading,
    refresh: refetch,
  };
}
