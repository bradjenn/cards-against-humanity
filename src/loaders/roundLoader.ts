import { redirect } from "@tanstack/react-router";
import { getGameBySlug } from "@/queries/gameQueries";
import { getPlayersForGame } from "@/queries/playerQueries";
import {
  getBlackCardForRound,
  getRoundByNumber,
  getSubmissionCount,
} from "@/queries/roundQueries";
import type { RouterContext } from "@/routerContext";

export async function roundLoader({
  params,
  context,
}: {
  params: {
    slug: string;
    roundNumber: string;
  };
  context: RouterContext;
}) {
  const { supabase, queryClient } = context;

  const roundNumber = Number(params.roundNumber);
  if (Number.isNaN(roundNumber)) {
    throw redirect({
      to: "/game/$slug",
      params: { slug: params.slug },
    });
  }

  // Load game - always fetch fresh to avoid stale round_number
  // (important because round_number updates when game starts)
  const game = await queryClient.fetchQuery({
    queryKey: ["game", params.slug],
    queryFn: () => getGameBySlug(supabase, params.slug),
  });

  if (!game) {
    throw new Response("Game not found", { status: 404 });
  }

  // Load round - always fetch fresh to avoid stale winning_player_id
  // (important because winning_player_id updates when judge picks winner)
  const round = await queryClient.fetchQuery({
    queryKey: ["round", game.id, roundNumber],
    queryFn: () => getRoundByNumber(supabase, game.id, roundNumber),
  });

  if (!round) {
    throw redirect({
      to: "/game/$slug",
      params: { slug: params.slug },
    });
  }

  // Load black card with caching
  const blackCard = await queryClient.ensureQueryData({
    queryKey: ["blackCard", round.black_card_id],
    queryFn: () => getBlackCardForRound(supabase, round.black_card_id),
  });

  if (!blackCard) {
    throw new Response("Black card missing", { status: 500 });
  }

  // Load players with caching
  const players = await queryClient.ensureQueryData({
    queryKey: ["players", game.id],
    queryFn: () => getPlayersForGame(supabase, game.id),
  });

  // Load submission count with caching
  const submissionsCount = await queryClient.ensureQueryData({
    queryKey: ["submissionCount", round.id],
    queryFn: () => getSubmissionCount(supabase, round.id),
  });

  return {
    game,
    round,
    blackCard,
    players,
    submissionsCount,
  };
}
