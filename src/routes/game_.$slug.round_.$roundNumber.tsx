import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BlackCard } from "@/components/round/BlackCard";
import { GameInfoPanel } from "@/components/round/GameInfoPanel";
import { JudgeRoundView } from "@/components/round/JudgeRoundView";
import { PlayerRoundView } from "@/components/round/PlayerRoundView";
import { useSupabase } from "@/components/SupabaseProvider";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { usePlayers } from "@/hooks/usePlayers";
import { useRound } from "@/hooks/useRound";
import { useWinnerCelebration } from "@/hooks/useWinnerCelebration";
import { roundLoader } from "@/loaders/roundLoader";

export const Route = createFileRoute("/game_/$slug/round_/$roundNumber")({
  loader: roundLoader,
  component: RoundPage,
});

function RoundPage() {
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const supabase = useSupabase();
  const { blackCard } = loaderData;

  const [localPlayerId] = useLocalPlayerId();
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // Core game state with realtime subscriptions
  const { game } = useGame(loaderData.game);
  const players = usePlayers(supabase, game.id);
  const { round, submissionsCount } = useRound({
    initialRound: loaderData.round,
    initialSubmissionsCount: loaderData.submissionsCount,
  });

  const isJudge = localPlayerId === round.judge_id;
  const isCurrentRound = game.round_number === round.round_number;
  const isWinner =
    localPlayerId != null && round.winning_player_id === localPlayerId;

  const { showWinnerBanner, celebrationGif, gifLoaded } = useWinnerCelebration({
    isWinner,
  });

  // Navigation helpers
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

  const navigateToGameOver = useCallback(() => {
    navigate({
      to: "/game/$slug/game-over",
      params: { slug: game.slug },
    });
  }, [navigate, game.slug]);

  // Redirect to game over if game has finished
  useEffect(() => {
    if (game.status === "FINISHED") {
      navigateToGameOver();
    }
  }, [game.status, navigateToGameOver]);

  // Auto-redirect when judge advances to next round
  useEffect(() => {
    if (!round.winning_player_id) return;
    if (game.round_number > round.round_number) {
      goToCurrentRound();
    }
  }, [game.round_number, round.round_number, round.winning_player_id, goToCurrentRound]);

  return (
    <div className="">
      {/* Winner celebration modal */}
      {showWinnerBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-lg p-8 max-w-md mx-4 text-center space-y-4">
            <h2 className="text-4xl font-bold">🏆 You Won This Round! 🏆</h2>
            {celebrationGif && (
              <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-black overflow-hidden">
                {gifLoaded ? (
                  <img
                    src={celebrationGif}
                    alt="Celebration"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="loading loading-spinner loading-lg" />
                  </div>
                )}
              </div>
            )}
            <p className="text-lg font-semibold">Your answer was the funniest!</p>
          </div>
        </div>
      )}

      {/* Past round banner */}
      {!isCurrentRound && (
        <div className="alert alert-info sticky top-0 z-20 rounded-none border-b shadow-sm">
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
            <span className="font-semibold">
              📜 Round {round.round_number} Summary (Current round: {game.round_number})
            </span>
            <button
              type="button"
              onClick={goToCurrentRound}
              className="btn btn-sm btn-primary"
            >
              Go to Current Round
            </button>
          </div>
        </div>
      )}

      {/* Black card header */}
      <div className="sticky top-0 border-b bg-white z-10">
        <div className="flex flex-col gap-3 max-w-4xl px-8 py-4 mx-auto">
          <BlackCard card={blackCard} />
        </div>
      </div>

      {/* Main content - judge or player view */}
      <div className="max-w-4xl mx-auto p-8 pb-24 space-y-8">
        {isJudge ? (
          <JudgeRoundView
            game={game}
            round={round}
            players={players}
            blackCard={blackCard}
            submissionsCount={submissionsCount}
            isCurrentRound={isCurrentRound}
            onOpenGameInfo={() => setIsInfoPanelOpen(true)}
            onGoToCurrentRound={goToCurrentRound}
            onNavigateToRound={navigateToRound}
            onNavigateToGameOver={navigateToGameOver}
          />
        ) : (
          <PlayerRoundView
            supabase={supabase}
            game={game}
            round={round}
            players={players}
            blackCard={blackCard}
            localPlayerId={localPlayerId}
            submissionsCount={submissionsCount}
            isCurrentRound={isCurrentRound}
            onOpenGameInfo={() => setIsInfoPanelOpen(true)}
            onGoToCurrentRound={goToCurrentRound}
          />
        )}
      </div>

      {/* Game info panel */}
      <GameInfoPanel
        players={players}
        roundNumber={round.round_number}
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
      />
    </div>
  );
}
