import type { SupabaseClient } from "@supabase/supabase-js";
import type { Card } from "@/types/db";

export async function getCardsByIds(
  supabase: SupabaseClient,
  cardIds: string[],
): Promise<Card[]> {
  if (cardIds.length === 0) return [];

  const { data } = await supabase.from("cards").select("*").in("id", cardIds);

  return data ?? [];
}
