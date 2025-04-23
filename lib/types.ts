export interface Game {
  id: string;
  category: string;
  status: "waiting" | "active" | "completed";
  current_drawer_id: string | null;
  current_card_id: string | null;
  timer_end: string | null;
  timer: number; // NEW: timer in seconds
  cards_generated: boolean;
  created_at: string;
  difficulty: string;
}

export interface Player {
  id: string;
  game_id: string;
  username: string;
  score: number;
  order_index: number;
  created_at: string;
}

export interface Card {
  id: string;
  game_id: string;
  title: string;
  description: string;
  used: boolean;
  created_at: string;
}

export interface Guess {
  id: string;
  game_id: string;
  player_id: string;
  guess_text: string;
  is_correct: boolean;
  created_at: string;
}
