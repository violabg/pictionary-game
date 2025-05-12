export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          full_name: string;
          user_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          full_name: string;
          user_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          full_name?: string;
          user_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          code: string; // Added game code
          category: string;
          status: "waiting" | "active" | "completed";
          max_players: number;
          current_drawer_id: string | null;
          current_card_id: string | null;
          timer_end: string | null;
          timer: number;
          cards_generated: boolean;
          difficulty: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code?: string; // Added game code
          category: string;
          status?: "waiting" | "active" | "completed";
          max_players?: number;
          current_drawer_id?: string | null;
          current_card_id?: string | null;
          timer_end?: string | null;
          timer?: number;
          cards_generated?: boolean;
          difficulty?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string; // Added game code
          category?: string;
          status?: "waiting" | "active" | "completed";
          max_players?: number;
          current_drawer_id?: string | null;
          current_card_id?: string | null;
          timer_end?: string | null;
          timer?: number;
          cards_generated?: boolean;
          difficulty?: string;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          player_id: string;
          game_id: string;
          username: string;
          score: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_id: string;
          username: string;
          score?: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_id?: string;
          username?: string;
          score?: number;
          order_index?: number;
          created_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          game_id: string;
          title: string;
          description: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          title: string;
          description: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          title?: string;
          description?: string;
          used?: boolean;
          created_at?: string;
        };
      };
      guesses: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          guess_text: string;
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id: string;
          guess_text: string;
          is_correct?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_id?: string;
          guess_text?: string;
          is_correct?: boolean;
          created_at?: string;
        };
      };
      drawings: {
        Row: {
          id: string;
          game_id: string;
          card_id: string;
          drawer_id: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          card_id: string;
          drawer_id: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          card_id?: string;
          drawer_id?: string;
          data?: Json;
          created_at?: string;
        };
      };
    };
    Functions: {
      increment_score: {
        Args: {
          points: number;
          row_id: string;
        };
        Returns: number;
      };
      generate_unique_game_code: {
        Args: Record<string, never>; // No arguments
        Returns: string;
      };
    };
  };
}

export type GetLeaderboardPlayersArgs = {
  offset_value: number;
  limit_value: number;
  language_filter?: string | null;
};
export type GetLeaderboardPlayersReturn = {
  player_id: string;
  total_score: number;
  name: string;
  full_name: string;
  user_name: string;
  avatar_url: string | null;
  total_items: number;
};

export type CountUniquePlayersArgs = Record<string, never>;
export type CountUniquePlayersReturn = number;

export type GetUserProfileWithScoreArgs = {
  user_id: string;
};
export type GetUserProfileWithScoreReturn = {
  profile_id: string;
  name: string;
  full_name: string;
  user_name: string;
  avatar_url: string | null;
  total_score: number;
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"];

export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardInsert = Database["public"]["Tables"]["cards"]["Insert"];
export type CardUpdate = Database["public"]["Tables"]["cards"]["Update"];

export type Guess = Database["public"]["Tables"]["guesses"]["Row"];
export type GuessInsert = Database["public"]["Tables"]["guesses"]["Insert"];
export type GuessUpdate = Database["public"]["Tables"]["guesses"]["Update"];

export type Drawing = Database["public"]["Tables"]["drawings"]["Row"];
export type DrawingInsert = Database["public"]["Tables"]["drawings"]["Insert"];
export type DrawingUpdate = Database["public"]["Tables"]["drawings"]["Update"];

export type GameWithPlayers = Game & {
  players: (Player & { profile: Profile })[];
  host: Profile;
};

export type GenerateUniqueGameCodeArgs =
  Database["public"]["Functions"]["generate_unique_game_code"]["Args"];

export type GenerateUniqueGameCodeReturn =
  Database["public"]["Functions"]["generate_unique_game_code"]["Returns"];
