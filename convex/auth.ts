import GitHub from "@auth/core/providers/github";
import Resend from "@auth/core/providers/resend";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Password, Resend],
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Create new profile
    const profileId = await ctx.db.insert("profiles", {
      user_id: userId,
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
 * Create or get profile from OAuth providers (GitHub, Resend, etc.)
 * Automatically creates a profile using the actual authenticated user data
 */
export const createOrGetOAuthProfile = mutation({
  args: {},
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Get the actual authenticated user data from the auth system
    const authUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();

    if (!authUser) {
      throw new Error("User not found in auth system");
    }

    // Extract user data from the authenticated user
    // email is stored in the user object
    const email = authUser.email || "";

    // Generate username from email or provider data
    let username = "User";
    if (email) {
      // Use email prefix as username (e.g., "john.doe@example.com" -> "john.doe")
      username = email.split("@")[0] || "User";
    } else if (authUser.name) {
      // Fallback to name if available
      username = authUser.name.replace(/\s+/g, "_").toLowerCase();
    }

    // Get avatar URL if available (some providers include this)
    const avatar_url = authUser.image || undefined;

    // Create new profile with actual user data
    const profileId = await ctx.db.insert("profiles", {
      user_id: userId,
      username: username,
      email: email,
      avatar_url: avatar_url,
      total_score: 0,
      games_played: 0,
    });

    return profileId;
  },
});

/**
 * Get the current user's profile
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    return profile || null;
  },
});
