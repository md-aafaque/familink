"use client";

import DotGrid from "./backgrounds/DotGrid";
import SoftShapes from "./backgrounds/SoftShapes";
import Sparkles from "./backgrounds/Sparkles";
import FamilyMotifs from "./backgrounds/FamilyMotifs";

interface CanvasBackgroundProps {
  canvasColor: string;
  gridDotColor: string;
  accentColor: string;
  w: number;
  h: number;
  themeKey: string;
}

/**
 * Multi-layer decorative canvas background.
 *
 * Layer 0 — Solid canvas color (base fill)
 * Layer 1 — Dot grid pattern
 * Layer 2 — Soft geometric shapes + rings
 * Layer 3 — Tiny decorative sparkles
 * Layer 4 — Family motif decorations (branch-like)
 */
export default function CanvasBackground({
  canvasColor, gridDotColor, accentColor, w, h, themeKey,
}: CanvasBackgroundProps) {
  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <DotGrid gridDotColor={gridDotColor} themeKey={themeKey} />
        <radialGradient id={`bg-glow-${themeKey}`} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.03" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 0: Solid canvas */}
      <rect width="100%" height="100%" fill={canvasColor} />

      {/* Layer 1: Dot grid */}
      <rect width="100%" height="100%" fill={`url(#bg-dots-${themeKey})`} />

      {/* Layer 2: Soft geometric shapes */}
      <SoftShapes accentColor={accentColor} themeKey={themeKey} />

      {/* Layer 3: Tiny sparkles */}
      <Sparkles accentColor={accentColor} themeKey={themeKey} />

      {/* Layer 4: Family motifs */}
      <FamilyMotifs accentColor={accentColor} themeKey={themeKey} />

      {/* Glow overlay */}
      <rect width="100%" height="100%" fill={`url(#bg-glow-${themeKey})`} />
    </svg>
  );
}
