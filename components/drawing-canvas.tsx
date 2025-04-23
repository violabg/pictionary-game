"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eraser, Pen, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "./supabase-provider";

interface DrawingCanvasProps {
  gameId: string;
  isDrawer: boolean;
  currentDrawerId: string | null;
  turnStarted: boolean;
}

export default function DrawingCanvas({
  gameId,
  isDrawer,
  currentDrawerId,
  turnStarted,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { supabase } = useSupabase();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const prevPointRef = useRef<{ x: number; y: number } | null>(null);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [strokes, setStrokes] = useState<any[]>([]); // Each stroke: { points: [{x, y}], color, width }
  const [currentStroke, setCurrentStroke] = useState<any | null>(null);

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = Math.min(
        window.innerHeight * 0.6,
        container.clientWidth * 0.75
      );
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

  // Reset history on new turn
  useEffect(() => {
    setStrokes([]);
    setCurrentStroke(null);
  }, [currentDrawerId]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawer || !turnStarted) return;

    setIsDrawing(true);
    const point = getPoint(e);
    prevPointRef.current = point;
    setCurrentStroke({
      points: [point],
      color: tool === "brush" ? color : "#ffffff",
      width: tool === "brush" ? lineWidth : eraserWidth,
    });
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
      tool === "brush" ? lineWidth : eraserWidth
    );

    // Add to current stroke
    setCurrentStroke((stroke: any) =>
      stroke ? { ...stroke, points: [...stroke.points, currentPoint] } : null
    );

    // Broadcast to other players
    supabase.channel(`drawing:${gameId}`).send({
      type: "broadcast",
      event: "drawing",
      payload: {
        type: "draw",
        data: {
          prevPoint,
          currentPoint,
          color: tool === "brush" ? color : "#ffffff",
          lineWidth: tool === "brush" ? lineWidth : eraserWidth,
        },
      },
    });

    prevPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPointRef.current = null;
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes((prev) => {
        const newStrokes = [...prev, currentStroke];
        // Broadcast new strokes to others
        supabase.channel(`drawing:${gameId}`).send({
          type: "broadcast",
          event: "drawing",
          payload: {
            type: "strokes",
            data: newStrokes,
          },
        });
        return newStrokes;
      });
    }
    setCurrentStroke(null);
  };

  // Redraw all strokes
  const redrawStrokes = (allStrokes: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of allStrokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        drawLine(
          stroke.points[i - 1].x,
          stroke.points[i - 1].y,
          stroke.points[i].x,
          stroke.points[i].y,
          stroke.color,
          stroke.width
        );
      }
    }
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
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
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isDrawer) {
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

  // Undo logic
  const handleUndo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const newStrokes = prev.slice(0, -1);
      if (newStrokes.length === 0) {
        clearCanvas();
      } else {
        redrawStrokes(newStrokes);
      }
      // Broadcast new strokes to others
      supabase.channel(`drawing:${gameId}`).send({
        type: "broadcast",
        event: "drawing",
        payload: {
          type: "strokes",
          data: newStrokes,
        },
      });
      return newStrokes;
    });
  };

  // Keyboard shortcuts for tool selection, clear, and undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawer || !turnStarted) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "p" || e.key === "P") {
        setTool("brush");
      } else if (e.key === "e" || e.key === "E") {
        setTool("eraser");
      } else if (e.key === "c" || e.key === "C") {
        clearCanvas();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawer, turnStarted]);

  // Subscribe to drawing updates
  useEffect(() => {
    if (isDrawer) return; // Drawer doesn't need to subscribe

    const drawingSubscription = supabase
      .channel(`drawing:${gameId}`)
      .on("broadcast", { event: "drawing" }, (payload) => {
        const { type, data } = payload.payload as any;

        if (type === "clear") {
          clearCanvas();
        } else if (type === "draw") {
          drawLine(
            data.prevPoint.x,
            data.prevPoint.y,
            data.currentPoint.x,
            data.currentPoint.y,
            data.color,
            data.lineWidth
          );
        } else if (type === "strokes") {
          setStrokes(data);
          redrawStrokes(data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(drawingSubscription);
    };
  }, [gameId, supabase, isDrawer]);

  // Get mouse/touch point relative to canvas
  const getPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  return (
    <div className="flex flex-col">
      {isDrawer && turnStarted && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="default" size="icon" className="p-0 w-8 h-8">
                  <div
                    className="border rounded-full w-4 h-4"
                    style={{
                      backgroundColor: color,
                      borderColor: "#d1d5db", // Tailwind gray-300
                      borderWidth: "2px",
                      borderStyle: "solid",
                    }}
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
                        borderColor: c === color ? "#d1d5db" : "transparent", // light gray border if selected
                        boxShadow: c === color ? "0 0 0 2px #fff" : undefined, // optional: white outline for contrast
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
              <Pen className="w-4 h-4" />
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
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="glass"
              size="icon"
              className="w-8 h-8"
              onClick={handleUndo}
              aria-label="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="w-8 h-8"
              onClick={clearCanvas}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="relative bg-white border rounded-md overflow-hidden">
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
