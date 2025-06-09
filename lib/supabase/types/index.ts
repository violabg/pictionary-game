export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string;
          description: string;
          game_id: string;
          id: string;
          title: string;
          title_length: number | null;
          used: boolean;
        };
        Insert: {
          created_at?: string;
          description: string;
          game_id: string;
          id?: string;
          title: string;
          title_length?: number | null;
          used?: boolean;
        };
        Update: {
          created_at?: string;
          description?: string;
          game_id?: string;
          id?: string;
          title?: string;
          title_length?: number | null;
          used?: boolean;
        };
        Relationships: [];
      };
      drawings: {
        Row: {
          card_id: string;
          created_at: string;
          data: Json;
          drawer_id: string;
          game_id: string;
          id: string;
          turn_id: string | null;
        };
        Insert: {
          card_id: string;
          created_at?: string;
          data: Json;
          drawer_id: string;
          game_id: string;
          id?: string;
          turn_id?: string | null;
        };
        Update: {
          card_id?: string;
          created_at?: string;
          data?: Json;
          drawer_id?: string;
          game_id?: string;
          id?: string;
          turn_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "drawings_turn_id_fkey";
            columns: ["turn_id"];
            isOneToOne: false;
            referencedRelation: "turns";
            referencedColumns: ["id"];
          }
        ];
      };
      games: {
        Row: {
          card_title_length: number | null;
          cards_generated: boolean;
          category: string;
          code: string;
          created_at: string;
          current_card_id: string | null;
          current_drawer_id: string | null;
          difficulty: string;
          id: string;
          max_players: number;
          status: string;
          timer: number;
          timer_end: string | null;
        };
        Insert: {
          card_title_length?: number | null;
          cards_generated?: boolean;
          category: string;
          code: string;
          created_at?: string;
          current_card_id?: string | null;
          current_drawer_id?: string | null;
          difficulty?: string;
          id?: string;
          max_players?: number;
          status: string;
          timer?: number;
          timer_end?: string | null;
        };
        Update: {
          card_title_length?: number | null;
          cards_generated?: boolean;
          category?: string;
          code?: string;
          created_at?: string;
          current_card_id?: string | null;
          current_drawer_id?: string | null;
          difficulty?: string;
          id?: string;
          max_players?: number;
          status?: string;
          timer?: number;
          timer_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_current_card_id_fkey";
            columns: ["current_card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_current_drawer_id_fkey";
            columns: ["current_drawer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      guesses: {
        Row: {
          created_at: string;
          game_id: string;
          guess_text: string;
          id: string;
          is_correct: boolean;
          player_id: string;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          guess_text: string;
          id?: string;
          is_correct?: boolean;
          player_id: string;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          guess_text?: string;
          id?: string;
          is_correct?: boolean;
          player_id?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          created_at: string;
          game_id: string;
          id: string;
          order_index: number;
          player_id: string | null;
          score: number;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          id?: string;
          order_index: number;
          player_id?: string | null;
          score?: number;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          id?: string;
          order_index?: number;
          player_id?: string | null;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          name: string | null;
          updated_at: string | null;
          user_name: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          name?: string | null;
          updated_at?: string | null;
          user_name?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          name?: string | null;
          updated_at?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
      turns: {
        Row: {
          id: string;
          game_id: string;
          card_id: string;
          drawer_id: string;
          winner_id: string | null;
          drawing_image_url: string | null;
          points_awarded: number;
          drawer_points_awarded: number;
          turn_number: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          card_id: string;
          drawer_id: string;
          winner_id?: string | null;
          drawing_image_url?: string | null;
          points_awarded?: number;
          drawer_points_awarded?: number;
          turn_number: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          card_id?: string;
          drawer_id?: string;
          winner_id?: string | null;
          drawing_image_url?: string | null;
          points_awarded?: number;
          drawer_points_awarded?: number;
          turn_number?: number;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "turns_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turns_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turns_drawer_id_fkey";
            columns: ["drawer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turns_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_unique_game_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_profile_with_score: {
        Args: { user_id: string };
        Returns: {
          profile_id: string;
          name: string;
          full_name: string;
          user_name: string;
          avatar_url: string;
          total_score: number;
        }[];
      };
      complete_turn_with_correct_guess: {
        Args: {
          p_game_id: string;
          p_guesser_id: string;
          p_guess_text: string;
          p_time_remaining: number;
          p_drawing_image_url?: string;
        };
        Returns: {
          success: boolean;
          next_drawer_id: string | null;
          next_card_id: string | null;
          guesser_new_score: number;
          drawer_new_score: number;
          turn_id: string | null;
          game_completed: boolean;
        }[];
      };
      complete_turn_time_up: {
        Args: {
          p_game_id: string;
          p_drawing_image_url?: string;
        };
        Returns: {
          success: boolean;
          next_drawer_id: string | null;
          next_card_id: string | null;
          turn_id: string | null;
          game_completed: boolean;
        }[];
      };
      complete_turn_manual_winner: {
        Args: {
          p_game_id: string;
          p_winner_id: string;
          p_time_remaining: number;
          p_drawing_image_url?: string;
        };
        Returns: {
          success: boolean;
          next_drawer_id: string | null;
          next_card_id: string | null;
          winner_new_score: number;
          drawer_new_score: number;
          turn_id: string | null;
          game_completed: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

export type Card = Tables<"cards">;
export type Drawings = Tables<"drawings">;
export type Game = Tables<"games">;
export type Guess = Tables<"guesses">;
export type Player = Tables<"players">;
export type Profile = Tables<"profiles">;
export type Turn = Tables<"turns">;

export type PlayerWithProfile = Player & { profile: Profile };

export type GameWithPlayers = Game & {
  players: PlayerWithProfile[];
  host: Profile;
};

export type TurnWithDetails = Turn & {
  card: Card;
  drawer: Profile;
  winner: Profile | null;
  game: Game;
};

// Atomic turn completion types
export interface AtomicTurnResult {
  success: boolean;
  next_drawer_id?: string;
  next_card_id?: string;
  guesser_new_score?: number;
  drawer_new_score?: number;
  winner_new_score?: number;
  turn_id?: string;
  game_completed: boolean;
}

export interface TurnCompletionParams {
  gameId: string;
  timeRemaining: number;
  drawingImageUrl?: string;
}

export interface CorrectGuessParams extends TurnCompletionParams {
  guesserId: string;
  guessText: string;
}

export interface ManualWinnerParams extends TurnCompletionParams {
  winnerId: string;
}
