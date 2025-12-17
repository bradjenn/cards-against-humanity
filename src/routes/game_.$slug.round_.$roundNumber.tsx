import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  // const judge = players.find((p) => p.id === round.judge_id) ?? null;

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
  const { showWinnerBanner } = useWinnerCelebration({ isWinner });

  const expectedSubmitters = Math.max(players.length - 1, 0);
  const allSubmitted = submissionsCount >= expectedSubmitters;
  const isRevealing =
    allSubmitted && round.revealed_count < submissionsCount;

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
      return;
    }

    // Redirect to current round if we're viewing an old round
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
  }, [game.status, game.round_number, round.round_number, game.slug, navigate]);

  function toggleCard(cardId: string) {
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }

      if (prev.length >= pick) {
        return prev;
      }

      return [...prev, cardId];
    });
  }

  async function submitCards() {
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
  }

  async function pickWinner(playerId: string, roundId: string) {
    try {
      await pickWinnerMutation.mutateAsync({
        roundId,
        winningPlayerId: playerId,
      });
    } catch (err) {
      console.error("Failed to pick winner", err);
    }
  }

  async function handleAdvanceRound() {
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
      }
    } catch (err) {
      console.error("Failed to advance round", err);
    }
  }

  async function handleRevealNext() {
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
  }

  /* ---------------------------
   * Render
   * --------------------------- */

  return (
    <div className="">
      {showWinnerBanner && (
        <div className="alert alert-success fixed m-0 flex justify-center align-center inset-0 z-50 shadow-lg">
          <span className="animate-bounce text-3xl">
            🏆 You won this round!
          </span>
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
              onPickWinner={(playerId) => pickWinner(playerId, round.id)}
            />

            <BottomToolbar
              gameInfoButton={{
                onClick: () => setIsInfoPanelOpen(true),
              }}
              content={
                !allSubmitted
                  ? {
                      message: `Waiting for players to submit (${submissionsCount}/${expectedSubmitters})`,
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
                    : round.winning_player_id
                      ? {
                          label: advanceRoundMutation.isPending
                            ? "Starting next round…"
                            : "Start next round",
                          onClick: handleAdvanceRound,
                          disabled: advanceRoundMutation.isPending,
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
              onToggleCard={hasSubmitted ? undefined : toggleCard}
              disabled={hasSubmitted}
              playerScore={
                players.find((p) => p.id === localPlayerId)?.score ?? 0
              }
            />

            <BottomToolbar
              gameInfoButton={{
                onClick: () => setIsInfoPanelOpen(true),
              }}
              content={
                hasSubmitted
                  ? {
                      message: "Waiting for other players to submit…",
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
