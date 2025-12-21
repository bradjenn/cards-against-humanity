import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BlackCard } from "@/components/round/BlackCard";
import { BottomToolbar } from "@/components/round/BottomToolbar";
import { GameInfoPanel } from "@/components/round/GameInfoPanel";
import { JudgeView } from "@/components/round/JudgeView";
import { useSupabase } from "@/components/SupabaseProvider";
import { useAdvanceRound } from "@/hooks/mutations/useAdvanceRound";
import { useGame } from "@/hooks/useGame";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { usePlayers } from "@/hooks/usePlayers";
import { useRound } from "@/hooks/useRound";
import { useWinnerCelebration } from "@/hooks/useWinnerCelebration";
import { roundLoader } from "@/loaders/roundLoader";

export const Route = createFileRoute(
  "/game_/$slug/round_/$roundNumber_/summary",
)({
  loader: roundLoader,
  component: RoundSummaryPage,
});

function RoundSummaryPage() {
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const { blackCard } = loaderData;

  const supabase = useSupabase();
  const [localPlayerId] = useLocalPlayerId();

  // Consolidated hook: uses loader data as initial, subscribes to realtime
  const { game } = useGame(loaderData.game);
  const players = usePlayers(supabase, game.id);
  const { round, submissionsCount } = useRound({
    initialRound: loaderData.round,
    initialSubmissionsCount: loaderData.submissionsCount,
  });

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const advanceRoundMutation = useAdvanceRound();

  const isJudge = localPlayerId === round.judge_id;

  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);

  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  const isWinner =
    localPlayerId != null && round.winning_player_id === localPlayerId;
  const { showWinnerBanner, celebrationGif, gifLoaded } = useWinnerCelebration({
    isWinner,
  });

  // Redirect to game over if game has finished
  useEffect(() => {
    if (game.status === "FINISHED") {
      navigate({
        to: "/game/$slug/game-over",
        params: { slug: game.slug },
        replace: true,
      });
    }
  }, [game.status, game.slug, navigate]);

  // When judge advances to next round, redirect all players to new active round
  // Only redirect if we're viewing a PAST round AND we have stable data
  useEffect(() => {
    // Don't redirect if we don't have winner data yet (prevents redirect loops on refresh)
    if (!round.winning_player_id) return;

    if (game.round_number > round.round_number) {
      navigate({
        to: "/game/$slug/round/$roundNumber",
        params: {
          slug: game.slug,
          roundNumber: String(game.round_number),
        },
        replace: true,
      });
    }
  }, [
    game.round_number,
    round.round_number,
    game.slug,
    navigate,
    round.winning_player_id,
  ]);

  const handleAdvanceRound = useCallback(async () => {
    try {
      const result = await advanceRoundMutation.mutateAsync({
        gameId: game.id,
        roundId: round.id,
      });

      // If result is null, game has ended
      if (result === null) {
        navigate({
          to: "/game/$slug/game-over",
          params: { slug: game.slug },
        });
      } else {
        // Navigate to the new round
        navigate({
          to: "/game/$slug/round/$roundNumber",
          params: {
            slug: game.slug,
            roundNumber: String(result.round_number),
          },
        });
      }
    } catch (err) {
      console.error("Failed to advance round", err);
    }
  }, [advanceRoundMutation, game.id, game.slug, round.id, navigate]);

  const goToCurrentRound = useCallback(() => {
    navigate({
      to: "/game/$slug/round/$roundNumber",
      params: {
        slug: game.slug,
        roundNumber: String(game.round_number),
      },
    });
  }, [game.slug, game.round_number, navigate]);

  const isCurrentRound = game.round_number === round.round_number;

  return (
    <div className="">
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
            <p className="text-lg font-semibold">
              Your answer was the funniest!
            </p>
          </div>
        </div>
      )}

      {!isCurrentRound && (
        <div className="alert alert-info sticky top-0 z-20 rounded-none border-b shadow-sm">
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
            <span className="font-semibold">
              📜 Round {round.round_number} Summary (Current round:{" "}
              {game.round_number})
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

      <div className="sticky top-0 border-b bg-white z-10">
        <div className="flex flex-col gap-3 max-w-4xl px-8 py-4 mx-auto">
          <BlackCard card={blackCard} selectedCards={[]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 pb-24 space-y-8">
        <JudgeView
          submissions={submissionsWithCards}
          players={players}
          winningSubmissionId={round.winning_player_id}
          totalSubmissions={submissionsCount}
        />

        <BottomToolbar
          gameInfoButton={{
            onClick: () => setIsInfoPanelOpen(true),
          }}
          content={
            !isCurrentRound
              ? {
                  label: `Go to Current Round`,
                  onClick: goToCurrentRound,
                  variant: "primary",
                }
              : isJudge
                ? {
                    label: advanceRoundMutation.isPending
                      ? "Starting next round…"
                      : "Start next round",
                    onClick: handleAdvanceRound,
                    disabled: advanceRoundMutation.isPending,
                    variant: "primary",
                  }
                : {
                    message: "Waiting for judge to start next round…",
                  }
          }
        />
      </div>

      {/* Game Info Panel */}
      <GameInfoPanel
        players={players}
        roundNumber={round.round_number}
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
      />
    </div>
  );
}
