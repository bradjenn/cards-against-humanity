import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type { Game } from "@/types/db";

export function useNavigationHelpers(game: Game) {
  const navigate = useNavigate();

  const goToCurrentRound = useCallback(() => {
    navigate({
      to: "/game/$slug/round/$roundNumber",
      params: {
        slug: game.slug,
        roundNumber: String(game.round_number),
      },
      replace: true,
    });
  }, [navigate, game.slug, game.round_number]);

  const navigateToRound = useCallback(
    (roundNumber: number) => {
      navigate({
        to: "/game/$slug/round/$roundNumber",
        params: {
          slug: game.slug,
          roundNumber: String(roundNumber),
        },
      });
    },
    [navigate, game.slug],
  );

  return {
    goToCurrentRound,
    navigateToRound,
  };
}
