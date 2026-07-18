"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  EraserIcon,
  MinusIcon,
  PencilIcon,
  Redo2Icon,
  SquareIcon,
  CircleIcon,
  Trash2Icon,
  Undo2Icon,
  DownloadIcon,
  PaletteIcon,
} from "lucide-react";

type Point = { x: number; y: number };

type Stroke =
  | { type: "pen" | "eraser"; color: string; width: number; points: Point[] }
  | {
      type: "line" | "rect" | "ellipse";
      color: string;
      width: number;
      start: Point;
      end: Point;
    };

export type WhiteboardTool = "pen" | "eraser" | "line" | "rect" | "ellipse";

const COLORS = [
  "#0f172a",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export type WhiteboardProps = {
  className?: string;
};

export function Whiteboard({ className }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);

  const [tool, setTool] = useState<WhiteboardTool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(strokesRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const all = currentRef.current
      ? [...strokesRef.current, currentRef.current]
      : strokesRef.current;

    for (const stroke of all) {
      ctx.strokeStyle = stroke.type === "eraser" ? "#ffffff" : stroke.color;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.type === "pen" || stroke.type === "eraser") {
        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      } else if (stroke.type === "line") {
        ctx.beginPath();
        ctx.moveTo(stroke.start.x, stroke.start.y);
        ctx.lineTo(stroke.end.x, stroke.end.y);
        ctx.stroke();
      } else if (stroke.type === "rect") {
        const x = Math.min(stroke.start.x, stroke.end.x);
        const y = Math.min(stroke.start.y, stroke.end.y);
        ctx.strokeRect(
          x,
          y,
          Math.abs(stroke.end.x - stroke.start.x),
          Math.abs(stroke.end.y - stroke.start.y)
        );
      } else if (stroke.type === "ellipse") {
        const cx = (stroke.start.x + stroke.end.x) / 2;
        const cy = (stroke.start.y + stroke.end.y) / 2;
        const rx = Math.abs(stroke.end.x - stroke.start.x) / 2;
        const ry = Math.abs(stroke.end.y - stroke.start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, []);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    const container = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => render());
      observer.observe(container);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [render]);

  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPoint(e);
    if (tool === "pen" || tool === "eraser") {
      currentRef.current = {
        type: tool,
        color,
        width: tool === "eraser" ? width * 4 : width,
        points: [p],
      };
    } else {
      currentRef.current = {
        type: tool,
        color,
        width,
        start: p,
        end: p,
      };
    }
    render();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !currentRef.current) return;
    const p = getPoint(e);
    const cur = currentRef.current;
    if (cur.type === "pen" || cur.type === "eraser") {
      cur.points.push(p);
    } else if (cur.type === "line" || cur.type === "rect" || cur.type === "ellipse") {
      cur.end = p;
    }
    render();
  };

  const finishStroke = () => {
    if (!drawingRef.current || !currentRef.current) return;
    drawingRef.current = false;
    const stroke = currentRef.current;
    currentRef.current = null;
    if (stroke.type === "pen" || stroke.type === "eraser") {
      if (stroke.points.length === 0) return;
    } else if (stroke.type === "line" || stroke.type === "rect" || stroke.type === "ellipse") {
      if (
        Math.abs(stroke.end.x - stroke.start.x) < 2 &&
        Math.abs(stroke.end.y - stroke.start.y) < 2
      )
        return;
    }
    strokesRef.current = [...strokesRef.current, stroke];
    redoRef.current = [];
    syncFlags();
    render();
  };

  const undo = () => {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current.at(-1)!;
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, last];
    syncFlags();
    render();
  };

  const redo = () => {
    if (redoRef.current.length === 0) return;
    const last = redoRef.current.at(-1)!;
    redoRef.current = redoRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, last];
    syncFlags();
    render();
  };

  const clear = () => {
    strokesRef.current = [];
    redoRef.current = [];
    currentRef.current = null;
    syncFlags();
    render();
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const tools: { id: WhiteboardTool; icon: typeof PencilIcon; label: string }[] = [
    { id: "pen", icon: PencilIcon, label: "Pen" },
    { id: "eraser", icon: EraserIcon, label: "Eraser" },
    { id: "line", icon: MinusIcon, label: "Line" },
    { id: "rect", icon: SquareIcon, label: "Rectangle" },
    { id: "ellipse", icon: CircleIcon, label: "Ellipse" },
  ];

  return (
    <div className={cn("flex size-full min-h-0 flex-col bg-white", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <Tooltip key={t.id}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={t.label}
                      aria-pressed={active}
                      onClick={() => setTool(t.id)}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md transition-colors",
                        active
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    />
                  }
                >
                  <Icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>{t.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Stroke color & size"
                className="gap-1.5"
              />
            }
          >
            <PaletteIcon className="size-4" />
            <span
              className="size-3 rounded-full ring-1 ring-border"
              style={{ backgroundColor: color }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3 p-3" align="start">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Color
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-6 rounded-full ring-2 ring-offset-1 ring-offset-background transition-transform",
                      color === c
                        ? "ring-foreground scale-110"
                        : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Size
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="h-1 w-full accent-indigo-500"
                aria-label="Stroke width"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                />
              }
            >
              <Undo2Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                />
              }
            >
              <Redo2Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clear}
                  disabled={!canUndo}
                  aria-label="Clear board"
                />
              }
            >
              <Trash2Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Clear board</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={download}
                  disabled={!canUndo}
                  aria-label="Download as PNG"
                />
              }
            >
              <DownloadIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Download PNG</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          style={{ touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>

    </div>
  );
}
