"use client";

import type React from "react";

import ToolBar from "@/components/game/tool-bar";
import { createClient } from "@/lib/supabase/client";
import { PlayerWithProfile } from "@/lib/supabase/types";
import { captureCanvasAsDataURL } from "@/lib/utils/canvas-utils";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// --- Update redrawStrokes to denormalize points ---
type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

interface DrawingCanvasProps {
  gameId: string;
  isDrawer: boolean;
  currentDrawer: PlayerWithProfile;
  turnStarted: boolean;
}

export interface DrawingCanvasRef {
  captureDrawing: () => string | null;
  getCanvas: () => HTMLCanvasElement | null;
}
const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ gameId, isDrawer, currentDrawer, turnStarted }, ref) => {
    const { id: currentDrawerId } = currentDrawer;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState(2);
    const [tool, setTool] = useState<"brush" | "eraser">("brush");
    const prevPointRef = useRef<{ x: number; y: number } | null>(null);
    const [eraserWidth, setEraserWidth] = useState(20);
    const [strokes, setStrokes] = useState<Stroke[]>([]); // Each stroke: { points: [{x, y}], color, width }
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);

    // Keep a ref to the latest strokes for use in resize handler
    const strokesRef = useRef(strokes);

    // Expose capture function to parent component
    useImperativeHandle(
      ref,
      () => ({
        captureDrawing: () => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          return captureCanvasAsDataURL(canvas);
        },
        getCanvas: () => canvasRef.current,
      }),
      []
    );

    const redrawStrokes = useCallback((allStrokes: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const stroke of allStrokes) {
        for (let i = 1; i < stroke.points.length; i++) {
          const p1 = denormalizePoint(stroke.points[i - 1], canvas);
          const p2 = denormalizePoint(stroke.points[i], canvas);
          drawLine(p1.x, p1.y, p2.x, p2.y, stroke.color, stroke.width);
        }
      }
    }, []);

    // Utility: Normalize and denormalize points
    const normalizePoint = (
      point: { x: number; y: number },
      canvas: HTMLCanvasElement
    ) => ({
      x: point.x / canvas.width,
      y: point.y / canvas.height,
    });
    const denormalizePoint = (
      point: { x: number; y: number },
      canvas: HTMLCanvasElement
    ) => ({
      x: point.x * canvas.width,
      y: point.y * canvas.height,
    });

    // --- Update startDrawing to use normalized points ---
    const startDrawing = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawer || !turnStarted) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      setIsDrawing(true);
      const point = getPoint(e);
      const normPoint = normalizePoint(point, canvas);
      prevPointRef.current = normPoint;
      setCurrentStroke({
        points: [normPoint],
        color: tool === "brush" ? color : "#ffffff",
        width: tool === "brush" ? lineWidth : eraserWidth,
      });
    };

    // --- Update draw to use normalized points and broadcast normalized ---
    const draw = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing || !isDrawer || !turnStarted || !prevPointRef.current)
        return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const currentPoint = getPoint(e);
      const normCurrent = normalizePoint(currentPoint, canvas);
      const prevPoint = prevPointRef.current;
      // Draw on local canvas (denormalize for drawing)
      drawLine(
        prevPoint.x * canvas.width,
        prevPoint.y * canvas.height,
        normCurrent.x * canvas.width,
        normCurrent.y * canvas.height,
        tool === "brush" ? color : "#ffffff",
        tool === "brush" ? lineWidth : eraserWidth
      );
      // Add to current stroke
      setCurrentStroke((stroke: Stroke | null) =>
        stroke ? { ...stroke, points: [...stroke.points, normCurrent] } : null
      );
      // Broadcast to other players (normalized)
      supabase.channel(`drawing:${gameId}`).send({
        type: "broadcast",
        event: "drawing",

        payload: {
          type: "draw",
          data: {
            prevPoint,
            currentPoint: normCurrent,
            color: tool === "brush" ? color : "#ffffff",
            lineWidth: tool === "brush" ? lineWidth : eraserWidth,
          },
        }
      });
      prevPointRef.current = normCurrent;
    };

    // --- Update stopDrawing to use normalized points ---
    const stopDrawing = () => {
      setIsDrawing(false);
      prevPointRef.current = null;
      if (currentStroke && currentStroke.points.length > 1) {
        setStrokes((prev) => {
          const newStrokes = [...prev, currentStroke];
          // Broadcast new strokes to others (normalized)
          supabase.channel(`drawing:${gameId}`).send({
            type: "broadcast",
            event: "drawing",

            payload: {
              type: "strokes",
              data: newStrokes,
            }
          });
          return newStrokes;
        });
      }
      setCurrentStroke(null);
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

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setStrokes([]); // Clear local strokes state

      if (isDrawer) {
        // Broadcast clear and empty strokes to other players
        supabase.channel(`drawing:${gameId}`).send({
          type: "broadcast",
          event: "drawing",

          payload: {
            type: "clear",
          }
        });
        supabase.channel(`drawing:${gameId}`).send({
          type: "broadcast",
          event: "drawing",

          payload: {
            type: "strokes",
            data: [],
          }
        });
      }
    }, [canvasRef, isDrawer, supabase, gameId]);

    // Undo logic
    const handleUndo = useCallback(() => {
      setStrokes((prev) => {
        if (prev.length === 0) return prev;
        const newStrokes = prev.slice(0, -1);
        if (newStrokes.length === 0) {
          clearCanvas();
        } else {
          redrawStrokes(newStrokes);
        }
        // Broadcast new strokes to others (normalized)
        supabase.channel(`drawing:${gameId}`).send({
          type: "broadcast",
          event: "drawing",

          payload: {
            type: "strokes",
            data: newStrokes,
          }
        });
        return newStrokes;
      });
    }, [redrawStrokes, supabase, gameId, clearCanvas]);

    // Get mouse/touch point relative to canvas, scaled to canvas size
    const getPoint = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
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
      // Scale from CSS pixels to canvas pixels
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    // Track mouse position for eraser cursor
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool === "eraser" || tool === "brush") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      draw(e);
    };

    const handleMouseLeave = () => {
      setMousePos(null);
      setIsCanvasHovered(false);
      stopDrawing();
    };

    const handleMouseEnter = () => {
      setIsCanvasHovered(true);
    };

    useEffect(() => {
      strokesRef.current = strokes;
    }, [strokes]);

    // Set up canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size with 4:3 aspect ratio
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (!container) return;
        // Use container width, but limit height to 4:3 aspect ratio
        const width = container.clientWidth;
        const height = Math.min(window.innerHeight * 0.6, width * 0.75); // 0.75 = 3/4
        canvas.width = width;
        canvas.height = height;
        // Redraw strokes after resizing, always use latest
        redrawStrokes(strokesRef.current);
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // Clear canvas on new turn
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [currentDrawerId, redrawStrokes]);

    // Reset history on new turn
    useEffect(() => {
      setStrokes([]);
      setCurrentStroke(null);
    }, [currentDrawerId]);

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
    }, [clearCanvas, handleUndo, isDrawer, turnStarted]);

    // Subscribe to drawing updates
    useEffect(() => {
      if (isDrawer) return; // Drawer doesn't need to subscribe

      const drawingSubscription = supabase
        .channel(`drawing:${gameId}`)
        .on("broadcast", {
        event: "drawing"
      }, (payload) => {
          const { type, data } = payload.payload;
          const canvas = canvasRef.current;
          if (!canvas) return;

          if (type === "clear") {
            clearCanvas();
          } else if (type === "draw") {
            // Denormalize points for drawing
            const p1 = denormalizePoint(data.prevPoint, canvas);
            const p2 = denormalizePoint(data.currentPoint, canvas);
            drawLine(p1.x, p1.y, p2.x, p2.y, data.color, data.lineWidth);
          } else if (type === "strokes") {
            setStrokes(data);
            redrawStrokes(data);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(drawingSubscription);
      };
    }, [gameId, supabase, isDrawer, clearCanvas, redrawStrokes]);

    return (
      <div className="flex flex-col rounded-md overflow-hidden">
        {isDrawer && turnStarted && (
          <ToolBar
            color={color}
            setColor={setColor}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            tool={tool}
            setTool={setTool}
            eraserWidth={eraserWidth}
            setEraserWidth={setEraserWidth}
            handleUndo={handleUndo}
            clearCanvas={clearCanvas}
          />
        )}

        <div className="relative bg-white border rounded-md aspect-[4/3] overflow-hidden">
          {!turnStarted && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-black/30 rounded-md pointer-events-none glass-card">
              <p className="text-white text-lg">
                {isDrawer
                  ? "Clicca 'Inizia il tuo turno' per iniziare a disegnare"
                  : `In attesa che ${currentDrawer.profile.name} inizi il turno...`}
              </p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`block w-full h-full touch-none ${
              tool !== "brush" && tool !== "eraser" ? "" : "cursor-none"
            }`}
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {/* Custom pen/eraser cursor */}
          {(tool === "eraser" || tool === "brush") &&
            isCanvasHovered &&
            mousePos && (
              <div
                style={{
                  position: "absolute",
                  left: `calc(${mousePos.x}px - ${
                    (tool === "eraser" ? eraserWidth : lineWidth) / 2
                  }px)`,
                  top: `calc(${mousePos.y}px - ${
                    (tool === "eraser" ? eraserWidth : lineWidth) / 2
                  }px)`,
                  width: tool === "eraser" ? eraserWidth : lineWidth,
                  height: tool === "eraser" ? eraserWidth : lineWidth,
                  pointerEvents: "none",
                  border:
                    tool === "eraser" ? "2px solid #888" : `2px solid ${color}`,
                  borderRadius: "50%",
                  background:
                    tool === "eraser"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.05)",
                  boxSizing: "border-box",
                  zIndex: 20,
                }}
              />
            )}
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
