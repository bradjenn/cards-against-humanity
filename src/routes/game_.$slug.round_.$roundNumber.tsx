import { createFileRoute } from "@tanstack/react-router";
import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { BlackCard } from "@/components/round/BlackCard";
import { GameInfoPanel } from "@/components/round/GameInfoPanel";
import { JudgePanel } from "@/components/round/JudgePanel";
import { JudgeView } from "@/components/round/JudgeView";
import { JudgeWaiting } from "@/components/round/JudgeWaiting";
import { PlayerHand } from "@/components/round/PlayerHand";
// import { RoundMeta } from "@/components/round/RoundMeta";
import { SubmitCardsButton } from "@/components/round/SubmitCardsButton";
import { useSupabase } from "@/components/SupabaseProvider";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useJudgeSubmissions } from "@/hooks/useJudgeSubmissions";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { usePlayers } from "@/hooks/usePlayers";
import { useRoundRealtime } from "@/hooks/useRoundRealtime";
import { useSubmittedCards } from "@/hooks/useSubmittedCards";
import { useWinnerCelebration } from "@/hooks/useWinnerCelebration";
import { roundLoader } from "@/loaders/roundLoader";
import { pickRoundWinner } from "@/server/round/pickRoundWinner";
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
      await pickRoundWinner({
        data: {
          roundId,
          winningPlayerId: playerId,
        },
      });
    } catch (err) {
      console.error("Failed to pick winner", err);
    }
  }

  /* ---------------------------
   * Render
   * --------------------------- */

  return (
    <div className="">
      {showWinnerBanner && (
        <div className="alert alert-success fixed m-0 flex justify-center align-center inset-0 z-30 shadow-lg">
          <span className="animate-bounce text-3xl">
            🏆 You won this round!
          </span>
        </div>
      )}

      <div className="sticky flex flex-col gap-3 top-0 border-b bg-white z-10 px-8 py-4">
        <BlackCard card={blackCard} />
        {/* <RoundMeta */}
        {/*   roundNumber={round.round_number} */}
        {/*   judge={judge} */}
        {/*   submissions={submissionsCount} */}
        {/*   totalPlayers={players.length} */}
        {/* /> */}

        {isJudge && !allSubmitted && <JudgeWaiting />}

        {hasSubmitted && !round.winning_player_id && !isJudge && (
          <div className="alert">
            You’ve submitted your cards. Waiting for other players…
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {isJudge ? (
          <>
            <JudgePanel
              round={round}
              gameId={game.id}
              gameSlug={game.slug}
              players={players}
              submissionsCount={submissionsCount}
              onPickWinner={(playerId) => pickWinner(playerId, round.id)}
            />

            {/* Floating game info button for judge */}
            <button
              type="button"
              onClick={() => setIsInfoPanelOpen(true)}
              className="btn btn-outline fixed bottom-4 right-4 z-30 shadow-lg"
            >
              Game Info
            </button>
          </>
        ) : (
          <>
            {round.winning_player_id && (
              <JudgeView
                submissions={submissionsWithCards}
                players={players}
                winningSubmissionId={round.winning_player_id}
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

            <div className="fixed flex justify-between bottom-0 left-0 right-0 bg-base-100 border-t p-3 gap-3 z-30">
              <button
                type="button"
                onClick={() => setIsInfoPanelOpen(true)}
                className="btn btn-outline rounded-sm"
              >
                Game Info
                <ChevronUp />
              </button>

              <SubmitCardsButton
                disabled={hasSubmitted || selectedCardIds.length !== pick}
                onSubmit={submitCards}
                pick={pick}
              />
            </div>
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
