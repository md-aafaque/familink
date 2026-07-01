"use client";

import { cn } from "@/lib/cn";
import { useState, useEffect } from "react";
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, Grid3X3, Moon, Sun,
  Maximize, MousePointer2, GitBranch, Layout,
} from "lucide-react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ThemeKey } from "./FamilyTreeContainer";

interface CanvasToolbarProps {
  transformRef: React.RefObject<ReactZoomPanPinchRef | null>;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  themeKey: ThemeKey;
  onThemeToggle: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  activeTool?: "select" | "connect" | "layout";
  onToolChange?: (tool: "select" | "connect" | "layout") => void;
}

export default function CanvasToolbar({
  transformRef,
  isFullScreen,
  onToggleFullScreen,
  themeKey,
  onThemeToggle,
  showGrid,
  onToggleGrid,
  activeTool = "select",
  onToolChange,
}: CanvasToolbarProps) {
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const el = transformRef.current?.instance?.contentComponent;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const scale = transformRef.current?.state?.scale;
      if (scale) setZoomLevel(Math.round(scale * 100));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [transformRef]);

  const handleZoomIn = () => {
    transformRef.current?.zoomIn(0.2);
    const scale = transformRef.current?.state?.scale;
    if (scale) setZoomLevel(Math.round(scale * 100));
  };
  const handleZoomOut = () => {
    transformRef.current?.zoomOut(0.2);
    const scale = transformRef.current?.state?.scale;
    if (scale) setZoomLevel(Math.round(scale * 100));
  };
  const handleFitView = () => {
    transformRef.current?.resetTransform();
    setZoomLevel(100);
  };

  const isDark = themeKey === "dark";

  const toolButtons = [
    { icon: MousePointer2, tool: "select" as const, label: "Select" },
    { icon: GitBranch, tool: "connect" as const, label: "Connect" },
    { icon: Layout, tool: "layout" as const, label: "Layout" },
  ];

  const actionButtons = [
    { icon: ZoomOut, label: "Zoom out", onClick: handleZoomOut },
    { icon: ZoomIn, label: "Zoom in", onClick: handleZoomIn },
    { icon: Maximize, label: "Fit view", onClick: handleFitView },
    { icon: Grid3X3, label: "Toggle grid", onClick: onToggleGrid, active: showGrid },
    { icon: isDark ? Moon : Sun, label: isDark ? "Light mode" : "Dark mode", onClick: onThemeToggle },
    { icon: isFullScreen ? Minimize2 : Maximize2, label: isFullScreen ? "Exit fullscreen" : "Fullscreen", onClick: onToggleFullScreen },
  ];

  return (
    <div className={cn(
      "absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto",
      "flex items-center gap-1 px-3",
      "h-14 rounded-[999px]",
      "bg-[#FFFDF5] dark:bg-[#1E293B]",
      "border-2 border-[#E2E8F0] dark:border-[#334155]",
      "shadow-[4px_4px_0px_rgba(15,23,42,0.08)] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]",
    )}>
      {toolButtons.map((btn) => {
        const Icon = btn.icon;
        const isActive = activeTool === btn.tool;
        return (
          <button
            key={btn.tool}
            onClick={() => onToolChange?.(btn.tool)}
            title={btn.label}
            aria-label={btn.label}
            aria-pressed={isActive}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              "hover:scale-105 active:scale-95",
              isActive
                ? "bg-[#F97316] text-white shadow-pop-sm border-2 border-[#1E293B]"
                : "bg-[#FFFDF5] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/10"
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        );
      })}

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {/* Zoom indicator */}
      <span className="text-[10px] font-bold tabular-nums text-[#1E293B] dark:text-[#F8FAFC] px-1 min-w-[32px] text-center select-none">
        {zoomLevel}%
      </span>

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {actionButtons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            onClick={btn.onClick}
            title={btn.label}
            aria-label={btn.label}
            aria-pressed={btn.active}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              "hover:scale-105 active:scale-95",
              btn.active
                ? "bg-[#F97316] text-white shadow-pop-sm border-2 border-[#1E293B]"
                : "bg-[#FFFDF5] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/10"
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
