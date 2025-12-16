export interface Game {
  id: string;
  slug: string;
  packs: string[];
  white_deck: string[];
  black_deck: string[];
  round_number: number;
  judge_index: number;
  status: "LOBBY" | "IN_PROGRESS" | "FINISHED";
  created_by: string | null;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  name: string;
  score: number;
  is_connected: boolean;
  joined_at: string;
}

export interface Card {
  id: string;
  pack_id: string;
  text: string;
  type: "WHITE" | "BLACK";
  pick: number;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  black_card_id: string;
  revealed_count: number;
  judge_id: string;
  winning_player_id: string | null;
  created_at: string;
}

export interface PlayerHand {
  id: string;
  game_id: string;
  player_id: string;
  card_id: string;
}
