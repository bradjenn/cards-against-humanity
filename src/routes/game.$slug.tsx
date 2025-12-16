import type { SupabaseClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { GameHeader } from "@/components/game/GameHeader";
import { HostControls } from "@/components/game/HostControls";
import { JoinForm } from "@/components/game/JoinForm";
import { LobbyPlayers } from "@/components/game/LobbyPlayers";

import { useSupabase } from "@/components/SupabaseProvider";
import { canStartGame } from "@/domain/rules";
import { useDisconnectTracking } from "@/hooks/useDisconnectTracking";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";
import { usePlayers } from "@/hooks/usePlayers";
import { dealLateJoinHand } from "@/server/game/dealLateJoinHand";
import { joinGame } from "@/server/game/joinGame";
import { startGame } from "@/server/game/startGame";
import type { Game } from "@/types/db";

export const Route = createFileRoute("/game/$slug")({
  component: GameLobbyPage,
});

function GameLobbyPage() {
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const supabase = useSupabase() as SupabaseClient;

  const { game, loading } = useGame(supabase, slug);
  const [localPlayerId, setLocalPlayerId] = useLocalPlayerId();
  const players = usePlayers(supabase, game?.id ?? null);

  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useDisconnectTracking(supabase, localPlayerId);

  const isPlayer =
    !!game && !!localPlayerId && players.some((p) => p.id === localPlayerId);

  const isHost = !!game && localPlayerId === game.created_by;

  useEffect(() => {
    if (
      !game ||
      !isPlayer ||
      game.status !== "IN_PROGRESS" ||
      game.round_number <= 0
    ) {
      return;
    }

    navigate({
      to: "/game/$slug/round/$roundNumber",
      params: {
        slug: game.slug,
        roundNumber: String(game.round_number),
      },
    });
  }, [game, isPlayer, navigate]);

  async function handleJoin(gameId: string) {
    setJoinError(null);

    if (!joinName.trim() || !game) {
      setJoinError("Enter your name.");
      return;
    }

    try {
      const player = await joinGame(supabase, {
        gameId,
        name: joinName,
      });

      setLocalPlayerId(player.id);

      // 🔑 Late join flow
      if (game.status === "IN_PROGRESS" && game.round_number > 0) {
        await dealLateJoinHand(supabase, {
          gameId: game.id,
          player,
          cardsPerPlayer: 10,
        });

        navigate({
          to: "/game/$slug/round/$roundNumber",
          params: {
            slug: game.slug,
            roundNumber: String(game.round_number),
          },
        });
      }
    } catch (err) {
      console.error(err);
      setJoinError("Could not join this game.");
    }
  }

  async function handleStartGame(game: Game) {
    setStartError(null);

    if (!canStartGame(players)) {
      setStartError("You need at least 3 players.");
      return;
    }

    setStarting(true);

    try {
      await startGame(supabase, {
        gameId: game.id,
        whiteCardsPerPlayer: 10,
      });

      navigate({
        to: "/game/$slug/round/$roundNumber",
        params: {
          slug: game.slug,
          roundNumber: "1",
        },
      });
    } catch (err) {
      console.error(err);
      setStartError("Could not start game.");
      setStarting(false);
    }
  }

  // ✅ ONLY render after guards
  if (loading) return <div>Loading…</div>;
  if (!game) return <div>Game not found.</div>;

  const prettyName = game.slug.replace(/-/g, " ");

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <GameHeader title={prettyName} playerCount={players.length} />

      {isPlayer ? (
        <>
          <LobbyPlayers players={players} />

          {isHost && game.status === "LOBBY" && (
            <>
              {startError && (
                <div className="alert alert-error">{startError}</div>
              )}
              <HostControls
                players={players}
                onStartGame={() => handleStartGame(game)}
                starting={starting}
              />
            </>
          )}
        </>
      ) : (
        <JoinForm
          joinName={joinName}
          setJoinName={setJoinName}
          joinError={joinError}
          onJoin={() => handleJoin(game.id)}
        />
      )}
    </div>
  );
}
