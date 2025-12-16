import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get current user's profile
 */
export const getCurrentUserProfile = query({
  args: {},
  returns: v.nullable(
    v.object({
      _id: v.id("profiles"),
      user_id: v.string(),
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()),
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    return profile || null;
  },
});

/**
 * Get a user's profile by user_id
 */
export const getProfile = query({
  args: {
    user_id: v.string(),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("profiles"),
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()),
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!profile) return null;

    return {
      _id: profile._id,
      username: profile.username,
      email: profile.email,
      avatar_url: profile.avatar_url,
      total_score: profile.total_score,
      games_played: profile.games_played,
    };
  },
});

/**
 * Get profile by profile ID
 */
export const getProfileById = query({
  args: {
    profile_id: v.id("profiles"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("profiles"),
      user_id: v.string(),
      username: v.string(),
      email: v.string(),
      avatar_url: v.optional(v.string()),
      total_score: v.number(),
      games_played: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profile_id);
  },
});

/**
 * Get leaderboard (top users by score)
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
    const profiles = await ctx.db.query("profiles").order("desc").take(limit);

    return profiles
      .sort((a, b) => b.total_score - a.total_score)
      .map((p) => ({
        username: p.username,
        total_score: p.total_score,
        games_played: p.games_played,
        avatar_url: p.avatar_url,
      }));
  },
});
