import type { SupabaseClient } from "@supabase/supabase-js";

export type GlobalStats = {
  totalGames: number;
  totalRounds: number;
  longestGame: number;
  activeGames: number;
};

export type TopPlayer = {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
};

export type TopCard = {
  id: string;
  text: string;
  timesWon: number;
  timesPlayed: number;
  winRate: number;
};

export type PlayerStats = {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  roundsWon: number;
  averageScore: number;
  rank: number | null;
};

export async function getGlobalStats(
  supabase: SupabaseClient,
): Promise<GlobalStats> {
  // Get total games (both in progress and finished, exclude lobby)
  const { count: totalGames } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .in("status", ["IN_PROGRESS", "FINISHED"]);

  // Get total rounds
  const { count: totalRounds } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true });

  // Get longest game (max round_number from both active and finished games)
  const { data: longestGameData } = await supabase
    .from("games")
    .select("round_number")
    .in("status", ["IN_PROGRESS", "FINISHED"])
    .order("round_number", { ascending: false })
    .limit(1)
    .single();

  // Get active games count
  const { count: activeGames } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("status", "IN_PROGRESS");

  return {
    totalGames: totalGames ?? 0,
    totalRounds: totalRounds ?? 0,
    longestGame: longestGameData?.round_number ?? 0,
    activeGames: activeGames ?? 0,
  };
}

export async function getTopPlayers(
  supabase: SupabaseClient,
  limit = 10,
): Promise<TopPlayer[]> {
  const { data } = await supabase.rpc("get_top_players", {
    limit_count: limit,
  });

  if (!data) {
    // Fallback if RPC doesn't exist - do it manually
    const { data: players } = await supabase
      .from("game_players")
      .select("name, score, game_id");

    if (!players) return [];

    // Group by name and calculate stats
    const playerMap = new Map<
      string,
      { totalScore: number; gamesPlayed: number }
    >();

    for (const player of players) {
      const existing = playerMap.get(player.name) || {
        totalScore: 0,
        gamesPlayed: 0,
      };
      existing.totalScore += player.score;
      existing.gamesPlayed += 1;
      playerMap.set(player.name, existing);
    }

    const topPlayers: TopPlayer[] = Array.from(playerMap.entries())
      .map(([name, stats]) => ({
        name,
        totalScore: stats.totalScore,
        gamesPlayed: stats.gamesPlayed,
        averageScore:
          stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return topPlayers;
  }

  return data as TopPlayer[];
}

export async function getTopWinningCards(
  supabase: SupabaseClient,
  limit = 10,
): Promise<TopCard[]> {
  const { data } = await supabase
    .from("card_stats")
    .select("card_id, times_won, times_played, cards(text)")
    .gt("times_won", 0)
    .order("times_won", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((stat) => ({
    id: stat.card_id,
    text: (stat.cards as any)?.text ?? "Unknown",
    timesWon: stat.times_won,
    timesPlayed: stat.times_played,
    winRate: stat.times_played > 0 ? stat.times_won / stat.times_played : 0,
  }));
}

export async function getTopPlayedCards(
  supabase: SupabaseClient,
  limit = 10,
): Promise<TopCard[]> {
  const { data } = await supabase
    .from("card_stats")
    .select("card_id, times_won, times_played, cards(text)")
    .gt("times_played", 0)
    .order("times_played", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((stat) => ({
    id: stat.card_id,
    text: (stat.cards as any)?.text ?? "Unknown",
    timesWon: stat.times_won,
    timesPlayed: stat.times_played,
    winRate: stat.times_played > 0 ? stat.times_won / stat.times_played : 0,
  }));
}

export async function getPlayerStatsByName(
  supabase: SupabaseClient,
  playerName: string,
): Promise<PlayerStats | null> {
  // Get all game_players records for this player name
  const { data: playerRecords } = await supabase
    .from("game_players")
    .select("id, name, score, game_id");

  if (!playerRecords || playerRecords.length === 0) return null;

  // Filter by name (case-insensitive)
  const playerData = playerRecords.filter(
    (p) => p.name.toLowerCase() === playerName.toLowerCase(),
  );

  if (playerData.length === 0) return null;

  // Calculate stats
  const totalScore = playerData.reduce((sum, p) => sum + p.score, 0);
  const gamesPlayed = playerData.length;
  const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;

  // Count rounds won
  const playerIds = playerData.map((p) => p.id);
  const { count: roundsWon } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true })
    .in("winning_player_id", playerIds);

  // Calculate rank by comparing total score with other players
  const allPlayers = await getTopPlayers(supabase, 1000);
  const playerRank =
    allPlayers.findIndex(
      (p) => p.name.toLowerCase() === playerName.toLowerCase(),
    ) + 1;

  return {
    name: playerData[0].name,
    totalScore,
    gamesPlayed,
    roundsWon: roundsWon ?? 0,
    averageScore,
    rank: playerRank > 0 ? playerRank : null,
  };
}

export async function getPlayerStatsById(
  supabase: SupabaseClient,
  playerId: string,
): Promise<PlayerStats | null> {
  // Get the specific player record
  const { data: player } = await supabase
    .from("game_players")
    .select("id, name, score")
    .eq("id", playerId)
    .single();

  if (!player) return null;

  // Get all records for this player name (same person across multiple games)
  const { data: playerRecords } = await supabase
    .from("game_players")
    .select("id, name, score, game_id");

  if (!playerRecords || playerRecords.length === 0) return null;

  // Filter by name (case-insensitive) to get all games this player played
  const playerData = playerRecords.filter(
    (p) => p.name.toLowerCase() === player.name.toLowerCase(),
  );

  if (playerData.length === 0) return null;

  // Calculate stats
  const totalScore = playerData.reduce((sum, p) => sum + p.score, 0);
  const gamesPlayed = playerData.length;
  const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;

  // Count rounds won
  const playerIds = playerData.map((p) => p.id);
  const { count: roundsWon } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true })
    .in("winning_player_id", playerIds);

  // Calculate rank by comparing total score with other players
  const allPlayers = await getTopPlayers(supabase, 1000);
  const playerRank =
    allPlayers.findIndex(
      (p) => p.name.toLowerCase() === player.name.toLowerCase(),
    ) + 1;

  return {
    name: player.name,
    totalScore,
    gamesPlayed,
    roundsWon: roundsWon ?? 0,
    averageScore,
    rank: playerRank > 0 ? playerRank : null,
  };
}
