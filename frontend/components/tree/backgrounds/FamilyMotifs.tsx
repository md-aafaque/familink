"use client";

import { useMemo } from "react";

interface FamilyMotifsProps {
  accentColor: string;
  themeKey: string;
}

function seedRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  let s = (h >>> 0) / 0xffffffff;
  return () => {
    s = Math.imul(16807, s) | 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

const MOTIF_COLORS = ["#F97316", "#FBBF24", "#F472B6", "#34D399", "#60A5FA", "#A78BFA"];

/* Motif types for variety */
type MotifType = "branch" | "leaf" | "nodeCluster" | "heritageRing";

function renderBranch(cx: number, cy: number, s: number, color: string, opacity: number) {
  return (
    <g key={`branch-${cx}-${cy}`} opacity={opacity}>
      <circle cx={`${cx}%`} cy={`${cy}%`} r={s} fill="none" stroke={color} strokeWidth="0.3" />
      <circle cx={`${cx + 1.2}%`} cy={`${cy - 0.8}%`} r={s * 0.5} fill={color} />
      <line x1={`${cx - s * 0.6}%`} y1={`${cy + s * 0.6}%`}
        x2={`${cx + s * 0.8}%`} y2={`${cy - s * 0.5}%`}
        stroke={color} strokeWidth="0.15" strokeLinecap="round" />
    </g>
  );
}

function renderLeaf(cx: number, cy: number, s: number, color: string, opacity: number) {
  return (
    <g key={`leaf-${cx}-${cy}`} opacity={opacity}>
      <ellipse cx={`${cx}%`} cy={`${cy}%`} rx={s * 0.8} ry={s * 0.5}
        fill="none" stroke={color} strokeWidth="0.25"
        transform={`rotate(${cx * 3.6}, ${cx}%, ${cy}%)`} />
      <line x1={`${cx - s * 0.6}%`} y1={`${cy}%`}
        x2={`${cx + s * 0.6}%`} y2={`${cy}%`}
        stroke={color} strokeWidth="0.15" strokeLinecap="round"
        transform={`rotate(${cx * 3.6}, ${cx}%, ${cy}%)`} />
    </g>
  );
}

function renderNodeCluster(cx: number, cy: number, s: number, color: string, opacity: number) {
  return (
    <g key={`nc-${cx}-${cy}`} opacity={opacity}>
      <circle cx={`${cx}%`} cy={`${cy}%`} r={s * 0.4} fill={color} />
      <circle cx={`${cx + s * 0.6}%`} cy={`${cy - s * 0.3}%`} r={s * 0.25} fill="none" stroke={color} strokeWidth="0.2" />
      <circle cx={`${cx - s * 0.5}%`} cy={`${cy + s * 0.5}%`} r={s * 0.2} fill="none" stroke={color} strokeWidth="0.15" />
      <line x1={`${cx}%`} y1={`${cy}%`} x2={`${cx + s * 0.5}%`} y2={`${cy - s * 0.3}%`}
        stroke={color} strokeWidth="0.1" />
      <line x1={`${cx}%`} y1={`${cy}%`} x2={`${cx - s * 0.4}%`} y2={`${cy + s * 0.5}%`}
        stroke={color} strokeWidth="0.1" />
    </g>
  );
}

function renderHeritageRing(cx: number, cy: number, s: number, color: string, opacity: number) {
  return (
    <g key={`hr-${cx}-${cy}`} opacity={opacity}>
      <circle cx={`${cx}%`} cy={`${cy}%`} r={s} fill="none" stroke={color} strokeWidth="0.2" />
      <circle cx={`${cx}%`} cy={`${cy}%`} r={s * 0.7} fill="none" stroke={color} strokeWidth="0.15" strokeDasharray="1 2" />
      <circle cx={`${cx}%`} cy={`${cy}%`} r={s * 0.3} fill={color} opacity={0.5} />
    </g>
  );
}

export default function FamilyMotifs({ accentColor, themeKey }: FamilyMotifsProps) {
  const motifs = useMemo(() => {
    const rng = seedRandom(`motif-${themeKey}`);
    const types: MotifType[] = ["branch", "leaf", "nodeCluster", "heritageRing"];
    const result: Array<{
      type: MotifType;
      x: number; y: number; size: number; opacity: number; color: string;
    }> = [];
    for (let i = 0; i < 16; i++) {
      result.push({
        type: types[i % types.length],
        x: 5 + rng() * 90,
        y: 5 + rng() * 90,
        size: 2 + rng() * 5,
        opacity: 0.03 + rng() * 0.03,
        color: MOTIF_COLORS[i % MOTIF_COLORS.length],
      });
    }
    return result;
  }, [themeKey]);

  return (
    <>
      {motifs.map((m) => {
        const s = m.size;
        switch (m.type) {
          case "branch":  return renderBranch(m.x, m.y, s, m.color, m.opacity);
          case "leaf":    return renderLeaf(m.x, m.y, s, m.color, m.opacity);
          case "nodeCluster": return renderNodeCluster(m.x, m.y, s, m.color, m.opacity);
          case "heritageRing": return renderHeritageRing(m.x, m.y, s, m.color, m.opacity);
        }
      })}
    </>
  );
}
