import { v } from "convex/values";
import { query } from "../_generated/server";

export const getTurnStrokes = query({
  args: {
    turn_id: v.id("turns"),
  },
  returns: v.object({
    strokes: v.array(
      v.object({
        points: v.array(v.object({ x: v.number(), y: v.number() })),
        color: v.string(),
        width: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_turn_id", (q) => q.eq("turn_id", args.turn_id))
      .first();

    if (!drawing) {
      return { strokes: [] };
    }

    // Reconstruct grouped strokes using strokeStart markers
    const strokes: {
      points: { x: number; y: number }[];
      color: string;
      width: number;
    }[] = [];
    let current: {
      points: { x: number; y: number }[];
      color: string;
      width: number;
    } | null = null;

    for (const pt of drawing.canvas_data.strokes) {
      const isStart = (pt as any).strokeStart === true || !current;
      if (isStart) {
        if (current && current.points.length > 0) strokes.push(current);
        current = { points: [], color: pt.color, width: pt.size };
      }
      if (!current) {
        current = { points: [], color: pt.color, width: pt.size };
      }
      current.points.push({ x: pt.x, y: pt.y });
    }
    if (current && current.points.length > 0) strokes.push(current);

    return { strokes };
  },
});
