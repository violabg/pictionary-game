"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eraser, Palette, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "./supabase-provider";

interface DrawingCanvasProps {
  gameId: string;
  isDrawer: boolean;
  currentDrawerId: string | null;
  turnStarted: boolean;
}

// Define types for drawing actions
type Point = { x: number; y: number };
type DrawAction = {
  type: "draw";
  points: { start: Point; end: Point };
  color: string;
  lineWidth: number;
};
type ClearAction = {
  type: "clear";
};
type DrawingAction = DrawAction | ClearAction;

export default function DrawingCanvas({
  gameId,
  isDrawer,
  currentDrawerId,
  turnStarted,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { supabase } = useSupabase();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const prevPointRef = useRef<Point | null>(null);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [drawingHistory, setDrawingHistory] = useState<DrawingAction[]>([]);
  const [canvasScale, setCanvasScale] = useState({ x: 1, y: 1 });
  const [canvasAspectRatio, setCanvasAspectRatio] = useState(4 / 3); // Default aspect ratio

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = Math.min(
        window.innerHeight * 0.6,
        containerWidth * 0.75
      );

      // Set canvas display size (CSS)
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;

      // Set canvas actual size (resolution)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;

      // Scale the context to account for the device pixel ratio
      ctx.scale(dpr, dpr);

      // Update canvas size state
      setCanvasSize({ width: containerWidth, height: containerHeight });
      setCanvasAspectRatio(containerWidth / containerHeight);

      // Calculate scale factors for normalizing coordinates
      setCanvasScale({
        x: 1000 / containerWidth, // Normalize to 1000x750 virtual canvas
        y: 750 / containerHeight,
      });

      // Redraw canvas content after resize
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Clear canvas on new turn
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [currentDrawerId]);

  // Subscribe to drawing updates
  useEffect(() => {
    const drawingSubscription = supabase
      .channel(`drawing:${gameId}`)
      .on("broadcast", { event: "drawing" }, (payload) => {
        const { type, data } = payload.payload as any;

        if (type === "clear") {
          clearCanvas(false); // Don't broadcast again
          setDrawingHistory([{ type: "clear" }]);
        } else if (type === "draw") {
          // Denormalize coordinates based on current canvas size
          const startX = data.prevPoint.x / canvasScale.x;
          const startY = data.prevPoint.y / canvasScale.y;
          const endX = data.currentPoint.x / canvasScale.x;
          const endY = data.currentPoint.y / canvasScale.y;

          drawLine(
            startX,
            startY,
            endX,
            endY,
            data.color,
            data.lineWidth,
            false // Don't broadcast again
          );

          // Add to history if not from this client
          if (!isDrawer) {
            setDrawingHistory((prev) => [
              ...prev,
              {
                type: "draw",
                points: {
                  start: { x: startX, y: startY },
                  end: { x: endX, y: endY },
                },
                color: data.color,
                lineWidth: data.lineWidth,
              },
            ]);
          }
        } else if (type === "undo") {
          handleUndoFromBroadcast(data.historyLength);
        } else if (type === "fullState") {
          // Apply full canvas state
          setDrawingHistory(data.history);
          redrawCanvas(data.history);
        }
      })
      .subscribe();

    // Request full canvas state when joining
    if (!isDrawer) {
      requestCanvasState();
    }

    return () => {
      supabase.removeChannel(drawingSubscription);
    };
  }, [gameId, supabase, isDrawer, canvasScale]);

  // Request full canvas state from the drawer
  const requestCanvasState = () => {
    supabase.channel(`drawing:${gameId}`).send({
      type: "broadcast",
      event: "drawing",
      payload: {
        type: "requestState",
      },
    });
  };

  // Redraw the entire canvas from history
  const redrawCanvas = (history = drawingHistory) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all actions
    for (const action of history) {
      if (action.type === "clear") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (action.type === "draw") {
        const { start, end } = action.points;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawer || !turnStarted) return;

    setIsDrawing(true);
    const point = getPoint(e);
    prevPointRef.current = point;
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !isDrawer || !turnStarted || !prevPointRef.current)
      return;

    const currentPoint = getPoint(e);
    const prevPoint = prevPointRef.current;

    // Draw on local canvas
    drawLine(
      prevPoint.x,
      prevPoint.y,
      currentPoint.x,
      currentPoint.y,
      tool === "brush" ? color : "#ffffff",
      tool === "brush" ? lineWidth : eraserWidth,
      true // Broadcast to others
    );

    // Add to history
    setDrawingHistory((prev) => [
      ...prev,
      {
        type: "draw",
        points: {
          start: { x: prevPoint.x, y: prevPoint.y },
          end: { x: currentPoint.x, y: currentPoint.y },
        },
        color: tool === "brush" ? color : "#ffffff",
        lineWidth: tool === "brush" ? lineWidth : eraserWidth,
      },
    ]);

    prevPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPointRef.current = null;
  };

  const getPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number,
    broadcast = false
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();

    if (broadcast && isDrawer) {
      // Normalize coordinates to a standard canvas size (1000x750)
      // This ensures consistent drawing across different screen sizes
      const normalizedPrevPoint = {
        x: x1 * canvasScale.x,
        y: y1 * canvasScale.y,
      };

      const normalizedCurrentPoint = {
        x: x2 * canvasScale.x,
        y: y2 * canvasScale.y,
      };

      // Broadcast to other players
      supabase.channel(`drawing:${gameId}`).send({
        type: "broadcast",
        event: "drawing",
        payload: {
          type: "draw",
          data: {
            prevPoint: normalizedPrevPoint,
            currentPoint: normalizedCurrentPoint,
            color,
            lineWidth: width,
          },
        },
      });
    }
  };

  const clearCanvas = (broadcast = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset drawing history
    setDrawingHistory([{ type: "clear" }]);

    if (broadcast && isDrawer) {
      // Broadcast clear to other players
      supabase.channel(`drawing:${gameId}`).send({
        type: "broadcast",
        event: "drawing",
        payload: {
          type: "clear",
        },
      });
    }
  };

  const handleUndo = () => {
    if (!isDrawer || drawingHistory.length === 0) return;

    // Remove the last action
    const newHistory = [...drawingHistory];
    newHistory.pop();

    // If we've removed everything, add a clear action
    if (newHistory.length === 0) {
      newHistory.push({ type: "clear" });
    }

    setDrawingHistory(newHistory);

    // Redraw canvas with updated history
    redrawCanvas(newHistory);

    // Broadcast undo to other players
    supabase.channel(`drawing:${gameId}`).send({
      type: "broadcast",
      event: "drawing",
      payload: {
        type: "undo",
        data: {
          historyLength: newHistory.length,
        },
      },
    });
  };

  const handleUndoFromBroadcast = (historyLength: number) => {
    // Truncate local history to match the drawer's history length
    const newHistory = drawingHistory.slice(0, historyLength);
    setDrawingHistory(newHistory);
    redrawCanvas(newHistory);
  };

  // Share full canvas state with new viewers
  useEffect(() => {
    if (isDrawer) {
      const subscription = supabase
        .channel(`drawing:${gameId}`)
        .on("broadcast", { event: "drawing" }, (payload) => {
          const { type } = payload.payload as any;

          if (type === "requestState") {
            // Send full canvas state to the requester
            supabase.channel(`drawing:${gameId}`).send({
              type: "broadcast",
              event: "drawing",
              payload: {
                type: "fullState",
                data: {
                  history: drawingHistory,
                },
              },
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isDrawer, gameId, supabase, drawingHistory]);

  const colors = [
    "#000000",
    "#FF0000",
    "#0000FF",
    "#008000",
    "#FFA500",
    "#800080",
    "#A52A2A",
    "#FFD700",
  ];

  return (
    <div className="flex flex-col">
      {isDrawer && turnStarted && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="glass" size="icon" className="p-0 w-8 h-8">
                  <div
                    className="rounded-full w-4 h-4"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-64 glass-card">
                <div className="gap-2 grid grid-cols-4">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className="flex justify-center items-center border-2 rounded-md w-12 h-12"
                      style={{
                        backgroundColor: c,
                        borderColor: c === color ? "#fff" : "transparent",
                      }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-sm">Brush Size</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={lineWidth}
                    onChange={(e) =>
                      setLineWidth(Number.parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={tool === "brush" ? "gradient" : "glass"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setTool("brush")}
            >
              <Palette className="w-4 h-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={tool === "eraser" ? "gradient" : "glass"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setTool("eraser")}
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-64 glass-card">
                <div className="mt-2">
                  <label className="text-sm">Eraser Size</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={eraserWidth}
                    onChange={(e) =>
                      setEraserWidth(Number.parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-center mt-2">
                    <div
                      className="bg-white border border-gray-300 rounded-full"
                      style={{
                        width: `${eraserWidth}px`,
                        height: `${eraserWidth}px`,
                      }}
                    ></div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="glass"
              size="icon"
              className="w-8 h-8"
              onClick={handleUndo}
              disabled={drawingHistory.length <= 1} // Disable if only clear action exists
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="glass"
            size="icon"
            className="w-8 h-8"
            onClick={() => clearCanvas(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div
        ref={canvasContainerRef}
        className="relative bg-white border rounded-md overflow-hidden"
      >
        {!turnStarted && (
          <div className="z-10 absolute inset-0 flex justify-center items-center bg-black/30 pointer-events-none glass-card">
            <p className="text-white text-lg">
              {isDrawer
                ? "Click 'Start Your Turn' to begin drawing"
                : "Waiting for drawer to start their turn..."}
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
