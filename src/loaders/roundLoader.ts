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
  const supabase = context.supabase;

  const roundNumber = Number(params.roundNumber);
  if (Number.isNaN(roundNumber)) {
    throw redirect({
      to: "/game/$slug",
      params: { slug: params.slug },
    });
  }

  const game = await getGameBySlug(supabase, params.slug);
  if (!game) {
    throw new Response("Game not found", { status: 404 });
  }

  const round = await getRoundByNumber(supabase, game.id, roundNumber);
  if (!round) {
    throw redirect({
      to: "/game/$slug",
      params: { slug: params.slug },
    });
  }

  const blackCard = await getBlackCardForRound(supabase, round.black_card_id);
  if (!blackCard) {
    throw new Response("Black card missing", { status: 500 });
  }

  const players = await getPlayersForGame(supabase, game.id);
  const submissionsCount = await getSubmissionCount(supabase, round.id);

  return {
    game,
    round,
    blackCard,
    players,
    submissionsCount,
  };
}
