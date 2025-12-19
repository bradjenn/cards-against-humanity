import { supabaseAdmin } from "@/server/supabaseAdmin";
import {
  getGlobalStats,
  getTopPlayers,
  getTopWinningCards,
} from "@/queries/statsQueries";

export async function homeLoader() {
  const supabase = supabaseAdmin();

  const [globalStats, topPlayers, topCards] = await Promise.all([
    getGlobalStats(supabase),
    getTopPlayers(supabase, 10),
    getTopWinningCards(supabase, 10),
  ]);

  return {
    globalStats,
    topPlayers,
    topCards,
  };
}
