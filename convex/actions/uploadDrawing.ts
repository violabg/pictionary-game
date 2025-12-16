"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

/**
 * Upload a drawing screenshot to Convex file storage
 */
export const uploadDrawingScreenshot = action({
  args: {
    gameId: v.id("games"),
    turnId: v.id("turns"),
    pngBlob: v.bytes(),
  },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Store the PNG blob in Convex file storage
    const blob = new Blob([args.pngBlob], { type: "image/png" });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

/**
 * Get URL for a drawing screenshot
 */
export const getDrawingUrl = action({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.nullable(v.string()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a drawing screenshot from storage
 */
export const deleteDrawingScreenshot = action({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Note: Convex file storage doesn't provide a direct delete method
    // Files are automatically cleaned up when references are removed
    return null;
  },
});
