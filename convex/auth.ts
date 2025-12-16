import { getUserIdentity } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Creates a profile for the authenticated user.
 * Called automatically after Convex Auth signup.
 */
export const createProfileIfNotExists = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    avatar_url: v.optional(v.string()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Create new profile
    const profileId = await ctx.db.insert("profiles", {
      user_id: identity.subject,
      username: args.username,
      email: args.email,
      avatar_url: args.avatar_url,
      total_score: 0,
      games_played: 0,
    });

    return profileId;
  },
});

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = mutation({
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
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    return profile || null;
  },
});
