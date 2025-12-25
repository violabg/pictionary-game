import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eraser, Pen, Trash2, Undo2 } from "lucide-react";
import React from "react";

const colors = [
  "#000000", // Black
  "#FF0000", // Red
  "#0000FF", // Blue
  "#008000", // Green
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#A52A2A", // Brown
  "#00FFFF", // Cyan
  "#FFC0CB", // Pink
  "#808080", // Gray
];

interface ToolBarProps {
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  tool: "brush" | "eraser";
  setTool: (tool: "brush" | "eraser") => void;
  eraserWidth: number;
  setEraserWidth: (width: number) => void;
  handleUndo: () => void;
  clearCanvas: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
  color,
  setColor,
  lineWidth,
  setLineWidth,
  tool,
  setTool,
  eraserWidth,
  setEraserWidth,
  handleUndo,
  clearCanvas,
}) => (
  <div className="flex justify-between items-center mb-2">
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="default" size="icon" className="p-0 w-8 h-8">
              <div
                className="border rounded-full w-4 h-4"
                style={{
                  backgroundColor: color,
                  borderColor: "#d1d5db",
                  borderWidth: "2px",
                  borderStyle: "solid",
                }}
              />
            </Button>
          }
        ></PopoverTrigger>
        <PopoverContent className="p-2 w-64 glass-card">
          <div className="gap-2 grid grid-cols-4">
            {colors.map((c) => (
              <button
                key={c}
                className="flex justify-center items-center border-2 rounded-md w-12 h-12"
                style={{
                  backgroundColor: c,
                  borderColor: c === color ? "#d1d5db" : "transparent",
                  boxShadow: c === color ? "0 0 0 2px #fff" : undefined,
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="mt-2">
            <label className="text-sm">Dimensione Pennello</label>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-xs">{lineWidth} px</span>
            </div>
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
        <Pen className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={tool === "eraser" ? "gradient" : "glass"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setTool("eraser")}
            >
              <Eraser className="w-4 h-4" />
            </Button>
          }
        ></PopoverTrigger>
        <PopoverContent className="p-2 w-64 glass-card">
          <div className="mt-2">
            <label className="text-sm">Dimensione Gomma</label>
            <input
              type="range"
              min="5"
              max="50"
              value={eraserWidth}
              onChange={(e) => setEraserWidth(Number.parseInt(e.target.value))}
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
);

export default ToolBar;
