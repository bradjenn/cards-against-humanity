import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePresence } from "@/hooks/usePresence";
import type { GamePlayer } from "@/types/db";

export type PlayerWithPresence = Omit<GamePlayer, "is_connected"> & {
  is_connected: boolean;
};

/**
 * Combines player data from the database with live presence state.
 *
 * The `is_connected` field on returned players is computed from Supabase
 * Presence API rather than the database, giving reliable real-time
 * connection status.
 */
export function usePlayersWithPresence(
  supabase: SupabaseClient,
  gameId: string | null,
  localPlayerId: string | null,
  localPlayerName?: string,
): PlayerWithPresence[] {
  // Get player data from database
  const players = usePlayers(supabase, gameId);

  // Get live presence state
  const { isPlayerOnline } = usePresence(
    supabase,
    gameId,
    localPlayerId,
    localPlayerName,
  );

  // Merge presence state into player data
  const playersWithPresence = useMemo(() => {
    return players.map((player) => ({
      ...player,
      is_connected: isPlayerOnline(player.id),
    }));
  }, [players, isPlayerOnline]);

  return playersWithPresence;
}
