"use client";

// Utility function to capture canvas as image blob
export function captureCanvasAsBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to capture canvas as blob"));
        }
      },
      "image/png",
      0.8
    );
  });
}

// Utility function to capture canvas as base64 data URL
export function captureCanvasAsDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png", 0.8);
}

// Create a temporary canvas to capture drawing at a specific size
export function createDrawingSnapshot(
  sourceCanvas: HTMLCanvasElement,
  width: number = 800,
  height: number = 600
): HTMLCanvasElement {
  const snapshotCanvas = document.createElement("canvas");
  snapshotCanvas.width = width;
  snapshotCanvas.height = height;

  const ctx = snapshotCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw the source canvas content, scaled to fit
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  return snapshotCanvas;
}
