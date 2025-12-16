"use client";

// Client-side function to capture and upload drawing screenshot
export const captureAndUploadDrawing = async (
  gameId: string,
  canvasDataUrl: string,
  uploadFn: (blob: Blob) => Promise<string | null>
): Promise<string | null> => {
  try {
    // Convert base64 data URL to Blob
    const response = await fetch(canvasDataUrl);
    const blob = await response.blob();

    // Upload to Convex file storage via action
    const storageId = await uploadFn(blob);

    if (!storageId) {
      console.error("Error uploading drawing: no storage ID returned");
      return null;
    }

    return storageId;
  } catch (error: unknown) {
    console.error("Error capturing and uploading drawing:", error);
    return null;
  }
};
