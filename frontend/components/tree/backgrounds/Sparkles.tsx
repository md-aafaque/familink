"use client";

import { useMemo } from "react";

interface SparklesProps {
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

const COLORS = ["#F97316", "#FBBF24", "#F472B6", "#34D399"];
const TYPES = ["circle", "diamond", "triangle", "star"] as const;

function renderStar(cx: string, cy: string, s: number, color: string, opacity: number) {
  const pts = 5;
  const outerR = s;
  const innerR = s * 0.4;
  const points: string[] = [];
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / pts) * i - Math.PI / 2;
    const px = parseFloat(cx) + r * Math.cos(angle);
    const py = parseFloat(cy) + r * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return (
    <polygon key={`star-${cx}-${cy}`}
      points={points.join(" ")}
      fill={color} opacity={opacity} />
  );
}

export default function Sparkles({ accentColor, themeKey }: SparklesProps) {
  const decorations = useMemo(() => {
    const rng = seedRandom(`spark-${themeKey}`);
    const result: Array<{
      type: typeof TYPES[number];
      x: number; y: number;
      size: number; opacity: number; color: string;
    }> = [];
    for (let i = 0; i < 36; i++) {
      result.push({
        type: TYPES[i % TYPES.length],
        x: rng() * 100,
        y: rng() * 100,
        size: 0.3 + rng() * 0.7,
        opacity: 0.07 + rng() * 0.06,
        color: COLORS[i % COLORS.length],
      });
    }
    return result;
  }, [themeKey]);

  return (
    <>
      {decorations.map((d, i) => {
        const s = d.size;
        switch (d.type) {
          case "diamond":
            return (
              <polygon key={i}
                points={`${d.x},${d.y - s * 2.2} ${d.x + s * 1.4},${d.y} ${d.x},${d.y + s * 2.2} ${d.x - s * 1.4},${d.y}`}
                fill={d.color} opacity={d.opacity} />
            );
          case "triangle":
            return (
              <polygon key={i}
                points={`${d.x},${d.y - s * 2} ${d.x + s * 1.6},${d.y + s * 1.6} ${d.x - s * 1.6},${d.y + s * 1.6}`}
                fill={d.color} opacity={d.opacity} />
            );
          case "star":
            return renderStar(`${d.x}`, `${d.y}`, s * 2, d.color, d.opacity);
          default:
            return (
              <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={s}
                fill={d.color} opacity={d.opacity} />
            );
        }
      })}
    </>
  );
}
