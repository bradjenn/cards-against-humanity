import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BlackCardBanner } from "@/components/round/BlackCardBanner";
import { GameInfoPanel } from "@/components/round/GameInfoPanel";
import { JudgeRoundView } from "@/components/round/JudgeRoundView";
import { PastRoundBanner } from "@/components/round/PastRoundBanner";
import { PlayerRoundView } from "@/components/round/PlayerRoundView";
import { WinnerBanner } from "@/components/round/WinnerBanner";
import { useSupabase } from "@/components/SupabaseProvider";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { useNavigationHelpers } from "@/hooks/useNavigationHelpers";
import { usePlayers } from "@/hooks/usePlayers";
import { useRound } from "@/hooks/useRound";
import { roundLoader } from "@/loaders/roundLoader";

export const Route = createFileRoute("/game_/$slug/round_/$roundNumber")({
  loader: roundLoader,
  component: RoundPage,
});

function RoundPage() {
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
  });

  const { goToCurrentRound, navigateToRound } = useNavigationHelpers(game);

  const isJudge = localPlayerId === round.judge_id;
  const isCurrentRound = game.round_number === round.round_number;
  const isWinner =
    localPlayerId != null && round.winning_player_id === localPlayerId;

  // Auto-redirect when judge advances to next round
  useEffect(() => {
    if (!round.winning_player_id) return;
    if (game.round_number > round.round_number) {
      goToCurrentRound();
    }
  }, [
    game.round_number,
    round.round_number,
    round.winning_player_id,
    goToCurrentRound,
  ]);

  return (
    <div className="">
      {/* Winner celebration modal */}
      <WinnerBanner isWinner={isWinner} />

      {/* Past round banner */}
      {!isCurrentRound && (
        <PastRoundBanner
          game={game}
          round={round}
          handleOnGoToCurrentRound={goToCurrentRound}
        />
      )}

      {/* Black card header */}
      <BlackCardBanner card={blackCard} />

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
