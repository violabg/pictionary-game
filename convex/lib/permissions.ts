import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Requires authentication and returns the authenticated user ID.
 * Throws if user is not authenticated.
 */
export const requireAuth = async (
  ctx: QueryCtx | MutationCtx
): Promise<string> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized: User not authenticated");
  return identity.subject;
};

/**
 * Checks if the given user is the host of the game.
 */
export const isGameHost = async (
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: string
): Promise<boolean> => {
  const game = await ctx.db.get(gameId);
  if (!game) return false;
  return game.created_by === userId;
};

/**
 * Checks if the given user is a player in the game.
 */
export const isGamePlayer = async (
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: string
): Promise<boolean> => {
  const player = await ctx.db
    .query("players")
    .withIndex("by_game_and_player", (q) =>
      q.eq("game_id", gameId).eq("player_id", userId)
    )
    .first();
  return player !== null;
};

/**
 * Checks if the given user can guess (i.e., is not the current drawer).
 */
export const canGuess = async (
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: string
): Promise<boolean> => {
  const game = await ctx.db.get(gameId);
  if (!game) return false;
  return game.current_drawer_id !== userId;
};

/**
 * Checks if the given user is the current drawer.
 */
export const isCurrentDrawer = async (
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: string
): Promise<boolean> => {
  const game = await ctx.db.get(gameId);
  if (!game) return false;
  return game.current_drawer_id === userId;
};
