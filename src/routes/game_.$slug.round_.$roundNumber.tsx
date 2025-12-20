import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlackCard } from "@/components/round/BlackCard";
import { BottomToolbar } from "@/components/round/BottomToolbar";
import { GameInfoPanel } from "@/components/round/GameInfoPanel";
import { JudgePanel } from "@/components/round/JudgePanel";
import { JudgeView } from "@/components/round/JudgeView";
import { PlayerHand } from "@/components/round/PlayerHand";
import { useSupabase } from "@/components/SupabaseProvider";
import { useAdvanceRound } from "@/hooks/mutations/useAdvanceRound";
import { usePickWinner } from "@/hooks/mutations/usePickWinner";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { usePlayers } from "@/hooks/usePlayers";
import { useRoundRealtime } from "@/hooks/useRoundRealtime";
import { useSubmittedCards } from "@/hooks/useSubmittedCards";
import { useWinnerCelebration } from "@/hooks/useWinnerCelebration";
import { roundLoader } from "@/loaders/roundLoader";
import { revealNextSubmission } from "@/server/round/revealNextSubmission";
import { submitRoundCards } from "@/services/roundService";

export const Route = createFileRoute("/game_/$slug/round_/$roundNumber")({
  loader: roundLoader,
  component: RoundViewPage,
});

function RoundViewPage() {
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const { blackCard } = loaderData;

  const supabase = useSupabase();
  const [localPlayerId] = useLocalPlayerId();

  const game = useGameRealtime(loaderData.game);
  const players = usePlayers(supabase, game.id);
  const { round, submissionsCount } = useRoundRealtime({
    initialRound: loaderData.round,
    initialSubmissionsCount: loaderData.submissionsCount,
  });

  const pick = blackCard.pick ?? 1;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const pickWinnerMutation = usePickWinner();
  const advanceRoundMutation = useAdvanceRound();

  const isJudge = localPlayerId === round.judge_id;

  /* ---------------------------
   * Player submission state
   * --------------------------- */

  const { hand } = usePlayerHand({
    gameId: game.id,
    playerId: localPlayerId,
    enabled: !isJudge && !!localPlayerId,
    roundId: round.id,
  });

  const {
    submittedCardIds,
    hasSubmitted,
    refresh: refreshSubmittedCards,
  } = useSubmittedCards({
    roundId: round.id,
    playerId: localPlayerId,
  });

  const { submissions, cardsByPlayer } = useJudgeSubmissions(round.id);

  const submissionsWithCards = submissions.map((s) => ({
    submissionId: s.player_id,
    cards: cardsByPlayer[s.player_id] ?? [],
  }));

  const isWinner =
    localPlayerId != null && round.winning_player_id === localPlayerId;
  const { showWinnerBanner, celebrationGif, gifLoaded } = useWinnerCelebration({ isWinner });

  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;
  const isRevealing =
    allSubmitted && round.revealed_count < submissionsCount;
  const isCurrentRound = game.round_number === round.round_number;

  // Get selected cards in order for black card preview
  // If player has submitted, show their submitted cards; otherwise show currently selected cards
  const selectedCards = !isJudge
    ? hasSubmitted
      ? submittedCardIds.map((id) => hand.find((card) => card.id === id)).filter(Boolean)
      : selectedCardIds.map((id) => hand.find((card) => card.id === id)).filter(Boolean)
    : [];

  useEffect(() => {
    if (!round.id) return;

    setSelectedCardIds([]);
  }, [round.id]);

  useEffect(() => {
    // Redirect to game over if game has finished
    if (game.status === "FINISHED") {
      navigate({
        to: "/game/$slug/game-over",
        params: { slug: game.slug },
        replace: true,
      });
    }
  }, [game.status, game.slug, navigate]);

  // Track when judge advances round to auto-redirect other players
  // Only redirect when round_number CHANGES, not just when viewing old rounds
  const prevRoundNumberRef = useRef(game.round_number);

  useEffect(() => {
    // Detect when game.round_number changes (judge advanced round)
    if (prevRoundNumberRef.current !== game.round_number) {
      prevRoundNumberRef.current = game.round_number;

      // Only redirect if we're viewing an old round (not the new current round)
      if (game.round_number !== round.round_number) {
        navigate({
          to: "/game/$slug/round/$roundNumber",
          params: {
            slug: game.slug,
            roundNumber: String(game.round_number),
          },
          replace: true,
        });
      }
    }
  }, [game.round_number, game.slug, round.round_number, navigate]);

  const toggleCard = useCallback(
    (cardId: string) => {
      setSelectedCardIds((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId);
        }

        if (prev.length >= pick) {
          return prev;
        }

        return [...prev, cardId];
      });
    },
    [pick],
  );

  const submitCards = useCallback(async () => {
    if (!localPlayerId) return;

    try {
      await submitRoundCards(supabase, {
        roundId: round.id,
        playerId: localPlayerId,
        cardIds: selectedCardIds,
      });

      setSelectedCardIds([]);
      refreshSubmittedCards();
    } catch (err) {
      console.error("Failed to submit cards", err);
    }
  }, [localPlayerId, supabase, round.id, selectedCardIds, refreshSubmittedCards]);

  const pickWinner = useCallback(
    async (playerId: string, roundId: string) => {
      try {
        await pickWinnerMutation.mutateAsync({
          roundId,
          winningPlayerId: playerId,
        });
      } catch (err) {
        console.error("Failed to pick winner", err);
      }
    },
    [pickWinnerMutation],
  );

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

  const handleRevealNext = useCallback(async () => {
    setRevealing(true);
    try {
      await revealNextSubmission({
        data: {
          roundId: round.id,
        },
      });
    } finally {
      setRevealing(false);
    }
  }, [round.id]);

  const goToCurrentRound = useCallback(() => {
    navigate({
      to: "/game/$slug/round/$roundNumber",
      params: {
        slug: game.slug,
        roundNumber: String(game.round_number),
      },
    });
  }, [game.slug, game.round_number, navigate]);

  /* ---------------------------
   * Render
   * --------------------------- */

  return (
    <div className="">
      {showWinnerBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-lg p-8 max-w-md mx-4 text-center space-y-4">
            <h2 className="text-4xl font-bold">
              🏆 You Won This Round! 🏆
            </h2>
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

      <div className="sticky  top-0 border-b bg-white z-10">
        <div className="flex flex-col gap-3 max-w-4xl px-8 py-4 mx-auto">
          <BlackCard card={blackCard} selectedCards={selectedCards} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 pb-24 space-y-8">
        {isJudge ? (
          <>
            <JudgePanel
              round={round}
              players={players}
              submissionsCount={submissionsCount}
              onPickWinner={
                isCurrentRound
                  ? (playerId) => pickWinner(playerId, round.id)
                  : undefined
              }
            />

            <BottomToolbar
              gameInfoButton={{
                onClick: () => setIsInfoPanelOpen(true),
              }}
              content={
                !isCurrentRound
                  ? {
                      label: `Go to Round ${game.round_number}`,
                      onClick: goToCurrentRound,
                      variant: "primary",
                    }
                  : !allSubmitted
                    ? {
                        message: `Waiting for players to submit (${submissionsCount}/${expectedSubmitters})`,
                      }
                    : round.winning_player_id
                      ? {
                          label: advanceRoundMutation.isPending
                            ? "Starting next round…"
                            : "Start next round",
                          onClick: handleAdvanceRound,
                          disabled: advanceRoundMutation.isPending,
                          variant: "primary",
                        }
                      : isRevealing
                        ? {
                            label: revealing
                              ? "Revealing…"
                              : "Reveal next submission",
                            onClick: handleRevealNext,
                            disabled: revealing,
                            variant: "primary",
                          }
                        : {
                            message: "Pick the winning submission above",
                          }
              }
            />
          </>
        ) : (
          <>
            {round.winning_player_id && (
              <JudgeView
                submissions={submissionsWithCards}
                players={players}
                winningSubmissionId={round.winning_player_id}
                totalSubmissions={submissionsCount}
              />
            )}
            <PlayerHand
              key={round.id}
              cards={hand}
              selectedCardIds={!hasSubmitted ? selectedCardIds : []}
              submittedCardIds={hasSubmitted ? submittedCardIds : []}
              onToggleCard={hasSubmitted || !isCurrentRound ? undefined : toggleCard}
              disabled={hasSubmitted || !isCurrentRound}
              playerScore={
                players.find((p) => p.id === localPlayerId)?.score ?? 0
              }
            />

            <BottomToolbar
              gameInfoButton={{
                onClick: () => setIsInfoPanelOpen(true),
              }}
              content={
                !isCurrentRound
                  ? {
                      label: `Go to Round ${game.round_number}`,
                      onClick: goToCurrentRound,
                      variant: "primary",
                    }
                  : round.winning_player_id
                    ? {
                        message: "Round complete! Waiting for next round…",
                      }
                    : hasSubmitted
                      ? {
                          message: allSubmitted
                            ? "Waiting for judge to pick winner…"
                            : "Waiting for other players to submit…",
                        }
                      : {
                          label: `Submit ${pick} Card${pick > 1 ? "s" : ""}`,
                          onClick: submitCards,
                          disabled: selectedCardIds.length !== pick,
                          variant: "primary",
                        }
              }
            />
          </>
        )}
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
