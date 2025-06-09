"use client";

import { createClient } from "@/lib/supabase/client";

// Client-side function to capture and upload drawing screenshot
export const captureAndUploadDrawing = async (
  gameId: string,
  canvasDataUrl: string
): Promise<string | null> => {
  try {
    const supabase = createClient();

    // Convert base64 data URL to Blob
    const response = await fetch(canvasDataUrl);
    const blob = await response.blob();

    // Generate filename with timestamp
    const timestamp = Date.now();
    const fileName = `drawings/${gameId}/turn-${timestamp}.png`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("game-drawings")
      .upload(fileName, blob, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading drawing image:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("game-drawings")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: unknown) {
    console.error("Error capturing and uploading drawing:", error);
    return null;
  }
};
