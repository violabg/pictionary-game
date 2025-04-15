"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Palette, Eraser, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DrawingCanvasProps {
  gameId: string
  isDrawer: boolean
  currentDrawerId: string | null
  turnStarted: boolean
}

export default function DrawingCanvas({ gameId, isDrawer, currentDrawerId, turnStarted }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { supabase } = useSupabase()
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(5)
  const [tool, setTool] = useState<"brush" | "eraser">("brush")
  const prevPointRef = useRef<{ x: number; y: number } | null>(null)
  const [eraserWidth, setEraserWidth] = useState(20)

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return

      canvas.width = container.clientWidth
      canvas.height = Math.min(window.innerHeight * 0.6, container.clientWidth * 0.75)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Clear canvas on new turn
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [currentDrawerId])

  // Subscribe to drawing updates
  useEffect(() => {
    if (isDrawer) return // Drawer doesn't need to subscribe

    const drawingSubscription = supabase
      .channel(`drawing:${gameId}`)
      .on("broadcast", { event: "drawing" }, (payload) => {
        const { type, data } = payload.payload as any

        if (type === "clear") {
          clearCanvas()
        } else if (type === "draw") {
          drawLine(
            data.prevPoint.x,
            data.prevPoint.y,
            data.currentPoint.x,
            data.currentPoint.y,
            data.color,
            data.lineWidth,
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(drawingSubscription)
    }
  }, [gameId, supabase, isDrawer])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !turnStarted) return

    setIsDrawing(true)
    const point = getPoint(e)
    prevPointRef.current = point
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || !turnStarted || !prevPointRef.current) return

    const currentPoint = getPoint(e)
    const prevPoint = prevPointRef.current

    // Draw on local canvas
    drawLine(
      prevPoint.x,
      prevPoint.y,
      currentPoint.x,
      currentPoint.y,
      tool === "brush" ? color : "#ffffff",
      tool === "brush" ? lineWidth : eraserWidth,
    )

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
    })

    prevPointRef.current = currentPoint
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    prevPointRef.current = null
  }

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = "round"
    ctx.stroke()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (isDrawer) {
      // Broadcast clear to other players
      supabase.channel(`drawing:${gameId}`).send({
        type: "broadcast",
        event: "drawing",
        payload: {
          type: "clear",
        },
      })
    }
  }

  const colors = ["#000000", "#FF0000", "#0000FF", "#008000", "#FFA500", "#800080", "#A52A2A", "#FFD700"]

  return (
    <div className="flex flex-col">
      {isDrawer && turnStarted && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="glass" size="icon" className="w-8 h-8 p-0">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 glass-card">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className="w-12 h-12 rounded-md border-2 flex items-center justify-center"
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
                    onChange={(e) => setLineWidth(Number.parseInt(e.target.value))}
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
              <Palette className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={tool === "eraser" ? "gradient" : "glass"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setTool("eraser")}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 glass-card">
                <div className="mt-2">
                  <label className="text-sm">Eraser Size</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={eraserWidth}
                    onChange={(e) => setEraserWidth(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-center">
                    <div
                      className="rounded-full bg-white border border-gray-300"
                      style={{ width: `${eraserWidth}px`, height: `${eraserWidth}px` }}
                    ></div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="glass" size="icon" className="w-8 h-8" onClick={clearCanvas}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="relative border rounded-md overflow-hidden bg-white">
        {!turnStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 glass-card bg-black/30">
            <p className="text-lg text-white">
              {isDrawer ? "Click 'Start Your Turn' to begin drawing" : "Waiting for drawer to start their turn..."}
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
  )
}
