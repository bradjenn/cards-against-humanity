import { useEffect, useState } from "react";

const STORAGE_KEY = "cah_player_id";

export function useLocalPlayerId(): [
  string | null,
  (id: string | null) => void,
] {
  const [playerId, setPlayerIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setPlayerIdState(stored);
  }, []);

  const setPlayerId = (id: string | null) => {
    if (id) {
      window.localStorage.setItem(STORAGE_KEY, id);
      setPlayerIdState(id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      setPlayerIdState(null);
    }
  };

  return [playerId, setPlayerId];
}
