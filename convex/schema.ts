import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    total_score: v.optional(v.number()),
    games_played: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_total_score", ["total_score"]),

  games: defineTable({
    code: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("started"),
      v.literal("finished")
    ),
    category: v.string(),
    created_by: v.string(),
    current_drawer_id: v.optional(v.string()),
    current_card_id: v.optional(v.id("cards")),
    round: v.number(),
    max_rounds: v.number(),
    created_at: v.number(),
    started_at: v.optional(v.number()),
    finished_at: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"])
    .index("by_created_by", ["created_by"])
    .index("by_created_by_and_status", ["created_by", "status"]),

  players: defineTable({
    game_id: v.id("games"),
    player_id: v.string(),
    username: v.string(),
    avatar_url: v.optional(v.string()),
    score: v.number(),
    correct_guesses: v.number(),
    is_host: v.boolean(),
    joined_at: v.number(),
  })
    .index("by_game_id", ["game_id"])
    .index("by_game_and_player", ["game_id", "player_id"])
    .index("by_player_id", ["player_id"]),

  cards: defineTable({
    game_id: v.id("games"),
    word: v.string(),
    description: v.string(),
    category: v.string(),
    is_used: v.boolean(),
    created_at: v.number(),
  })
    .index("by_game_id", ["game_id"])
    .index("by_game_and_unused", ["game_id", "is_used"]),

  guesses: defineTable({
    game_id: v.id("games"),
    turn_id: v.id("turns"),
    player_id: v.string(),
    guess_text: v.string(),
    is_correct: v.boolean(),
    is_fuzzy_match: v.boolean(),
    submitted_at: v.number(),
  })
    .index("by_game_id", ["game_id"])
    .index("by_turn_id", ["turn_id"])
    .index("by_player_id", ["player_id"]),

  drawings: defineTable({
    game_id: v.id("games"),
    card_id: v.id("cards"),
    drawer_id: v.string(),
    turn_id: v.id("turns"),
    canvas_data: v.object({
      strokes: v.array(
        v.object({
          x: v.number(),
          y: v.number(),
          color: v.string(),
          size: v.number(),
          timestamp: v.number(),
          // Optional flag to indicate the start of a new stroke
          strokeStart: v.optional(v.boolean()),
        })
      ),
      width: v.number(),
      height: v.number(),
    }),
    drawing_file_id: v.optional(v.id("_storage")),
    created_at: v.number(),
  })
    .index("by_game_id", ["game_id"])
    .index("by_turn_id", ["turn_id"]),

  turns: defineTable({
    game_id: v.id("games"),
    round: v.number(),
    drawer_id: v.string(),
    card_id: v.id("cards"),
    status: v.union(
      v.literal("drawing"),
      v.literal("completing"),
      v.literal("completed"),
      v.literal("time_up")
    ),
    time_limit: v.number(),
    started_at: v.optional(v.number()), // Set when first stroke is drawn (draw-to-start timer)
    completed_at: v.optional(v.number()),
    correct_guesses: v.number(),
    // Scoring fields
    winner_id: v.optional(v.string()),
    points_awarded: v.optional(v.number()),
    drawer_points_awarded: v.optional(v.number()),
  })
    .index("by_game_id", ["game_id"])
    .index("by_game_and_round", ["game_id", "round"])
    .index("by_drawer_id", ["drawer_id"]),
});
