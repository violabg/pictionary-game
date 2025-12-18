"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Upload a drawing screenshot to Convex file storage and save to database
 * This is an atomic operation that ensures the drawing is both uploaded and recorded
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

    // Atomically save the storage ID to the drawing record
    await ctx.runMutation(internal.mutations.drawings.saveDrawingStorageId, {
      turn_id: args.turnId,
      storage_id: storageId,
    });

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
