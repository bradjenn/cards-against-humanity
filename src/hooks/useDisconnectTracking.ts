import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";
import { setPlayerConnected } from "@/services/playerService";

export function useDisconnectTracking(
  supabase: SupabaseClient,
  playerId: string | null,
) {
  useEffect(() => {
    if (!playerId) return;

    // Mark as connected now
    void setPlayerConnected(supabase, playerId, true);

    const handleBeforeUnload = () => {
      void setPlayerConnected(supabase, playerId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void setPlayerConnected(supabase, playerId, false);
    };
  }, [supabase, playerId]);
}
