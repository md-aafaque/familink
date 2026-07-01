"use client";

import { cn } from "@/lib/cn";
import { useState, useEffect, useRef } from "react";
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, Maximize,
  MousePointer2, Palette, Download,
} from "lucide-react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { DecorationLayer, ActiveLayers } from "./FamilyTreeContainer";

interface CanvasToolbarProps {
  transformRef: React.RefObject<ReactZoomPanPinchRef | null>;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  activeLayers: ActiveLayers;
  onToggleLayer: (layer: DecorationLayer) => void;
  onToggleAll: () => void;
  onExport: (format: "png" | "pdf") => void;
  isExporting: boolean;
}

const LAYERS: { value: DecorationLayer; label: string; description: string }[] = [
  { value: "dots", label: "Dots", description: "Subtle dot pattern" },
  { value: "whimsy", label: "Whimsy", description: "Playful sparkles" },
  { value: "nature", label: "Nature", description: "Leaves & branches" },
  { value: "vibrant", label: "Vibrant", description: "Soft shapes & circles" },
];

export default function CanvasToolbar({
  transformRef,
  isFullScreen,
  onToggleFullScreen,
  activeLayers,
  onToggleLayer,
  onToggleAll,
  onExport,
  isExporting,
}: CanvasToolbarProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [bgOpen, setBgOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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

  // Close background picker on outside click
  useEffect(() => {
    if (!bgOpen) return;
    const handler = (e: MouseEvent) => {
      if (bgRef.current && !bgRef.current.contains(e.target as Node)) setBgOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bgOpen]);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

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

  const btnBase = [
    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
    "hover:scale-105 active:scale-95",
    "bg-[#FFFDF5] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/10",
  ].join(" ");

  const btnActive = [
    "bg-[#F97316] text-white shadow-pop-sm border-2 border-[#1E293B]",
  ].join(" ");

  return (
    <div className={cn(
      "absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto",
      "flex items-center gap-1 px-3",
      "h-14 rounded-[999px]",
      "bg-[#FFFDF5] dark:bg-[#1E293B]",
      "border-2 border-[#E2E8F0] dark:border-[#334155]",
      "shadow-[4px_4px_0px_rgba(15,23,42,0.08)] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]",
    )}>
      {/* Select tool indicator */}
      <div
        title="Select mode"
        aria-label="Select mode"
        className={cn(btnBase, btnActive)}
      >
        <MousePointer2 className="w-[18px] h-[18px]" />
      </div>

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {/* Background preset picker */}
      <div ref={bgRef} className="relative">
        <button
          onClick={() => setBgOpen(o => !o)}
          title="Background design"
          aria-label="Background design"
          aria-expanded={bgOpen}
          className={btnBase}
        >
          <Palette className="w-[18px] h-[18px]" />
        </button>
        {bgOpen && (
          <div className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-3",
            "min-w-[180px] rounded-2xl border-2 shadow-pop-lg overflow-hidden",
            "bg-[#FFFDF5] dark:bg-[#1E293B]",
            "border-[#E2E8F0] dark:border-[#334155]",
          )}>
            <div className="py-1.5">
              <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
                Background
              </p>
              {LAYERS.map(l => (
                <button
                  key={l.value}
                  onClick={() => onToggleLayer(l.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    activeLayers[l.value]
                      ? "bg-[#F97316]/10 text-[#F97316] dark:text-[#FB923C] font-bold"
                      : "text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/5"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    activeLayers[l.value]
                      ? "border-[#F97316] bg-[#F97316]"
                      : "border-[#E2E8F0] dark:border-[#334155]"
                  )}>
                    {activeLayers[l.value] && (
                      <span className="text-white text-[10px] font-black leading-none">&#10003;</span>
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{l.label}</p>
                    <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8] leading-tight">{l.description}</p>
                  </div>
                </button>
              ))}
              <div className="mx-3 my-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
              <button
                onClick={onToggleAll}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors font-bold",
                  "text-[#F97316] dark:text-[#FB923C] hover:bg-[#F97316]/5"
                )}
              >
                <span className="w-5 h-5 rounded border-2 border-[#F97316] bg-[#F97316] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black leading-none">
                    {Object.values(activeLayers).every(Boolean) ? "–" : "+"}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight">Full Bloom</p>
                  <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8] leading-tight">Select / deselect all</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export button */}
      <div ref={exportRef} className="relative">
        <button
          onClick={() => setExportOpen(o => !o)}
          disabled={isExporting}
          title="Download"
          aria-label="Download"
          aria-expanded={exportOpen}
          className={cn(btnBase, isExporting && "opacity-50 pointer-events-none")}
        >
          <Download className="w-[18px] h-[18px]" />
        </button>
        {exportOpen && (
          <div className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-3",
            "min-w-[140px] rounded-2xl border-2 shadow-pop-lg overflow-hidden",
            "bg-[#FFFDF5] dark:bg-[#1E293B]",
            "border-[#E2E8F0] dark:border-[#334155]",
          )}>
            <div className="py-1.5">
              <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
                Download
              </p>
              <button onClick={() => onExport("png")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/5 text-xs font-bold">
                As Image (PNG)
              </button>
              <button onClick={() => onExport("pdf")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F97316]/5 text-xs font-bold">
                As Document (PDF)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {/* Zoom indicator */}
      <span className="text-[10px] font-bold tabular-nums text-[#1E293B] dark:text-[#F8FAFC] px-1 min-w-[32px] text-center select-none">
        {zoomLevel}%
      </span>

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {/* Zoom controls */}
      <button onClick={handleZoomOut} title="Zoom out" aria-label="Zoom out" className={btnBase}>
        <ZoomOut className="w-[18px] h-[18px]" />
      </button>
      <button onClick={handleZoomIn} title="Zoom in" aria-label="Zoom in" className={btnBase}>
        <ZoomIn className="w-[18px] h-[18px]" />
      </button>
      <button onClick={handleFitView} title="Fit view" aria-label="Fit view" className={btnBase}>
        <Maximize className="w-[18px] h-[18px]" />
      </button>

      <div className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

      {/* Fullscreen */}
      <button
        onClick={onToggleFullScreen}
        title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
        aria-label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
        className={btnBase}
      >
        {isFullScreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
      </button>
    </div>
  );
}
