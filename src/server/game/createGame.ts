import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game, GamePlayer } from "@/types/db";

export interface CreateGameInput {
  slug: string;
  packs: string[];
  hostName: string;
}

export interface CreateGameResult {
  game: Game;
  host: GamePlayer;
}

function generateJoinCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function createGame(
  supabase: SupabaseClient,
  input: CreateGameInput,
): Promise<CreateGameResult> {
  const { slug, packs, hostName } = input;

  // 1 Create game with ALL required fields
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .insert({
      slug,
      packs,
      join_code: generateJoinCode(),
      status: "LOBBY",
      round_number: 0,
      judge_index: 0,
      white_deck: [], // safe initial state
      black_deck: [],
    })
    .select()
    .single<Game>();

  if (gameErr || !game) {
    console.error("createGame error:", gameErr);
    throw new Error("Could not create game");
  }

  // 2 Create host player
  const { data: host, error: hostErr } = await supabase
    .from("game_players")
    .insert({
      game_id: game.id,
      name: hostName.trim(),
      is_connected: true,
    })
    .select()
    .single<GamePlayer>();

  if (hostErr || !host) {
    // Roll back game if host fails
    await supabase.from("games").delete().eq("id", game.id);
    throw new Error("Could not create host player");
  }

  // 3 Set created_by
  await supabase
    .from("games")
    .update({ created_by: host.id })
    .eq("id", game.id);

  return { game, host };
}
