import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { homeLoader } from "@/loaders/homeLoader";
import { Trophy, Users, Zap, Target, TrendingUp, User } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPlayerStatsById, type PlayerStats } from "@/queries/statsQueries";
import { useLocalPlayerId } from "@/hooks/useLocalPlayerId";

export const Route = createFileRoute("/")({
  loader: homeLoader,
  component: HomePage,
});

function HomePage() {
  const { globalStats, topPlayers, topCards } = Route.useLoaderData();
  const supabase = useSupabase();
  const [localPlayerId] = useLocalPlayerId();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(true);

  useEffect(() => {
    async function loadPlayerStats() {
      try {
        if (!localPlayerId) {
          setLoadingPlayerStats(false);
          return;
        }

        const stats = await getPlayerStatsById(supabase, localPlayerId);
        setPlayerStats(stats);
      } catch (error) {
        console.error("Failed to load player stats:", error);
      } finally {
        setLoadingPlayerStats(false);
      }
    }

    loadPlayerStats();
  }, [supabase, localPlayerId]);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section with Global Stats */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cards Against Humanity
          </h1>
          <p className="text-xl opacity-90 mb-8">
            The party game for horrible people
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white text-black rounded-lg p-6 border-2 border-black">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" />
                <div className="text-sm opacity-75">Total Games</div>
              </div>
              <div className="text-3xl font-bold">
                {globalStats.totalGames.toLocaleString()}
              </div>
            </div>

            <div className="bg-white text-black rounded-lg p-6 border-2 border-black">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" />
                <div className="text-sm opacity-75">Rounds Played</div>
              </div>
              <div className="text-3xl font-bold">
                {globalStats.totalRounds.toLocaleString()}
              </div>
            </div>

            <div className="bg-white text-black rounded-lg p-6 border-2 border-black">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <div className="text-sm opacity-75">Longest Game</div>
              </div>
              <div className="text-3xl font-bold">
                {globalStats.longestGame} rounds
              </div>
            </div>

            <div className="bg-white text-black rounded-lg p-6 border-2 border-black">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <div className="text-sm opacity-75">Active Games</div>
              </div>
              <div className="text-3xl font-bold">
                {globalStats.activeGames}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-8">
        {/* Player Personal Stats */}
        {!loadingPlayerStats && playerStats && (
          <section className="card bg-black text-white p-6 border-4 border-black">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Your Stats</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white text-black rounded-lg p-4 border-2 border-black">
                <div className="text-sm opacity-75 mb-1">Games Played</div>
                <div className="text-2xl font-bold">{playerStats.gamesPlayed}</div>
              </div>

              <div className="bg-white text-black rounded-lg p-4 border-2 border-black">
                <div className="text-sm opacity-75 mb-1">Total Points</div>
                <div className="text-2xl font-bold">{playerStats.totalScore}</div>
              </div>

              <div className="bg-white text-black rounded-lg p-4 border-2 border-black">
                <div className="text-sm opacity-75 mb-1">Rounds Won</div>
                <div className="text-2xl font-bold">{playerStats.roundsWon}</div>
              </div>

              <div className="bg-white text-black rounded-lg p-4 border-2 border-black">
                <div className="text-sm opacity-75 mb-1">Avg Score</div>
                <div className="text-2xl font-bold">
                  {playerStats.averageScore.toFixed(1)}
                </div>
              </div>

              <div className="bg-white text-black rounded-lg p-4 border-2 border-black">
                <div className="text-sm opacity-75 mb-1">Global Rank</div>
                <div className="text-2xl font-bold">
                  {playerStats.rank ? `#${playerStats.rank}` : "N/A"}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Global Leaderboard */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Funniest Players</h2>
            </div>

            {topPlayers.length === 0 ? (
              <div className="card bg-white border-2 border-black p-8 text-center">
                <p className="text-base-content/60">
                  No games played yet. Be the first!
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.name}
                    className={`card p-4 flex flex-row items-center justify-between border-2 min-h-[80px] ${
                      index === 0
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className={`text-xs ${index === 0 ? 'opacity-75' : 'opacity-60'}`}>
                          {player.gamesPlayed} game
                          {player.gamesPlayed !== 1 ? "s" : ""} • {player.averageScore.toFixed(1)} avg
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="w-5 h-5" />}
                      <div className="text-xl font-bold">{player.totalScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Winning Cards */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Most Winning Cards</h2>
            </div>

            {topCards.length === 0 ? (
              <div className="card bg-white border-2 border-black p-8 text-center">
                <p className="text-base-content/60">
                  No card stats yet. Start playing to see what wins!
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {topCards.map((card, index) => {
                  const isFirst = index === 0;
                  return (
                    <div
                      key={card.id}
                      className={`card p-4 flex flex-row items-center justify-between border-2 min-h-[80px] ${
                        isFirst
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm italic line-clamp-1">"{card.text}"</div>
                          <div className={`text-xs ${isFirst ? 'opacity-75' : 'opacity-60'}`}>
                            Played: {card.timesPlayed} • Win Rate: {(card.winRate * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFirst && <Trophy className="w-5 h-5" />}
                        <div className="text-xl font-bold">{card.timesWon}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Fixed Bottom Toolbar with New Game Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t z-30">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-center">
          <Link to="/new-game" className="btn btn-primary btn-lg rounded-sm">
            <Zap className="w-5 h-5" />
            Start New Game
          </Link>
        </div>
      </div>
    </div>
  );
}
