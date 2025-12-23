import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface PresenceState {
  playerId: string;
  name?: string;
  joinedAt: string;
}

/**
 * Hook that manages player presence using Supabase Realtime Presence API.
 *
 * Unlike database-based tracking with beforeunload events, Presence API:
 * - Uses automatic heartbeats to detect disconnections reliably
 * - Works even when browser crashes, tab is killed, or network drops
 * - Is ephemeral (no database writes needed)
 */
export function usePresence(
  supabase: SupabaseClient,
  gameId: string | null,
  localPlayerId: string | null,
  playerName?: string,
) {
  const [presenceState, setPresenceState] = useState<Map<string, PresenceState>>(
    new Map(),
  );

  useEffect(() => {
    if (!gameId || !localPlayerId) return;

    const channel = supabase.channel(`presence-${gameId}`, {
      config: {
        presence: {
          key: localPlayerId,
        },
      },
    });

    // Handle presence sync - called when we first connect and get current state
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      const newMap = new Map<string, PresenceState>();

      // presenceState returns { [key]: PresenceState[] } - each key can have multiple presences
      for (const [key, presences] of Object.entries(state)) {
        if (presences.length > 0) {
          newMap.set(key, presences[0]);
        }
      }

      setPresenceState(newMap);
    });

    // Handle individual join events
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (newPresences.length > 0) {
        setPresenceState((prev) => {
          const next = new Map(prev);
          next.set(key, newPresences[0] as PresenceState);
          return next;
        });
      }
    });

    // Handle individual leave events
    channel.on("presence", { event: "leave" }, ({ key }) => {
      setPresenceState((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    });

    // Subscribe and track our own presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          playerId: localPlayerId,
          name: playerName,
          joinedAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, gameId, localPlayerId, playerName]);

  return {
    presenceState,
    isPlayerOnline: (playerId: string) => presenceState.has(playerId),
  };
}
