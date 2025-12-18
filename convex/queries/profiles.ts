import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get current user's profile (now from users table)
 */
export const getCurrentUserProfile = query({
  args: {},
  returns: v.nullable(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      user_id: v.string(), // Same as _id for compatibility
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()), // Maps to image field
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      user_id: user._id, // For compatibility with existing code
      username:
        user.username ?? user.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      avatar_url: user.image,
      total_score: user.total_score ?? 0,
      games_played: user.games_played ?? 0,
    };
  },
});

/**
 * Get a user's profile by user_id
 */
export const getProfile = query({
  args: {
    user_id: v.id("users"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("users"),
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()),
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) return null;

    return {
      _id: user._id,
      username:
        user.username ?? user.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      avatar_url: user.image,
      total_score: user.total_score ?? 0,
      games_played: user.games_played ?? 0,
    };
  },
});

/**
 * Get profile by user ID (renamed from getProfileById for clarity)
 */
export const getProfileById = query({
  args: {
    profile_id: v.id("users"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      user_id: v.string(),
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()),
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.profile_id);
    if (!user) return null;

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      user_id: user._id,
      username:
        user.username ?? user.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      avatar_url: user.image,
      total_score: user.total_score ?? 0,
      games_played: user.games_played ?? 0,
    };
  },
});

/**
 * Get leaderboard (top users by score)
 * Now uses index for efficient sorting
 */
export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      username: v.string(),
      total_score: v.number(),
      games_played: v.number(),
      avatar_url: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Use index for efficient sorting by total_score
    const users = await ctx.db
      .query("users")
      .withIndex("by_total_score")
      .order("desc")
      .take(limit * 2); // Take more to filter out users without scores

    return users
      .filter((u) => (u.total_score ?? 0) > 0) // Only include users with scores
      .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
      .slice(0, limit)
      .map((u) => ({
        username: u.username ?? u.name ?? u.email?.split("@")[0] ?? "User",
        total_score: u.total_score ?? 0,
        games_played: u.games_played ?? 0,
        avatar_url: u.image,
      }));
  },
});
