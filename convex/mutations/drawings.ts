import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Types that mirror client-side structure (normalized points)
const point = v.object({ x: v.number(), y: v.number() });
const stroke = v.object({
  points: v.array(point),
  color: v.string(),
  width: v.number(),
});

/**
 * Save the canonical list of strokes for a turn.
 * Replaces the existing strokes array to allow undo/clear semantics.
 */
export const saveTurnStrokes = mutation({
  args: {
    turn_id: v.id("turns"),
    strokes: v.array(stroke),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

    // Only the current drawer can write strokes for this turn
    if (turn.drawer_id !== userId) {
      throw new Error("Only drawer can update strokes");
    }

    const game = await ctx.db.get(turn.game_id);
    if (!game) throw new Error("Game not found");

    // Flatten strokes to point stream with strokeStart markers
    const now = Date.now();
    const flat = args.strokes.flatMap((s, idx) =>
      s.points.map((p, i) => ({
        x: p.x,
        y: p.y,
        color: s.color,
        size: s.width,
        timestamp: now, // single timestamp bucket is fine for now
        strokeStart: i === 0 && idx >= 0 ? true : undefined,
      }))
    );

    // Find existing drawing doc for this turn
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_turn_id", (q) => q.eq("turn_id", args.turn_id))
      .first();

    if (!existing) {
      await ctx.db.insert("drawings", {
        game_id: turn.game_id,
        card_id: turn.card_id,
        drawer_id: turn.drawer_id,
        turn_id: turn._id,
        canvas_data: {
          strokes: flat,
          width: 1,
          height: 1,
        },
        created_at: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        canvas_data: {
          strokes: flat,
          width: existing.canvas_data.width ?? 1,
          height: existing.canvas_data.height ?? 1,
        },
      } as any);
    }

    return null;
  },
});
