"use client";

import { createClient } from "./client";

// Update turn with drawing image URL (client-side function)
export async function updateTurnDrawingImage(
  turnId: string,
  drawingImageUrl: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("turns")
    .update({ drawing_image_url: drawingImageUrl })
    .eq("id", turnId);

  if (error) {
    console.error("Error updating turn drawing image:", error);
    throw new Error("Failed to update turn drawing image");
  }
}
