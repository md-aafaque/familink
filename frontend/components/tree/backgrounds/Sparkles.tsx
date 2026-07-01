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
  let s = Math.abs(h) / 0x7fffffff;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const COLORS = ["#F97316", "#FBBF24", "#F472B6", "#34D399"];
const TYPES = ["circle", "diamond", "triangle", "star"] as const;

function renderStarPoints(s: number): string {
  const pts = 5;
  const outerR = s;
  const innerR = s * 0.4;
  const points: string[] = [];
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / pts) * i - Math.PI / 2;
    const px = r * Math.cos(angle);
    const py = r * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(" ");
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
        size: 3 + rng() * 6,
        opacity: 0.15 + rng() * 0.15,
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
                points={`0,${-s * 2.2} ${s * 1.4},0 0,${s * 2.2} ${-s * 1.4},0`}
                fill={d.color} opacity={d.opacity}
                transform={`translate(${d.x}%, ${d.y}%)`} />
            );
          case "triangle":
            return (
              <polygon key={i}
                points={`0,${-s * 2} ${s * 1.6},${s * 1.6} ${-s * 1.6},${s * 1.6}`}
                fill={d.color} opacity={d.opacity}
                transform={`translate(${d.x}%, ${d.y}%)`} />
            );
          case "star":
            return (
              <polygon key={i} points={renderStarPoints(s * 2)}
                fill={d.color} opacity={d.opacity}
                transform={`translate(${d.x}%, ${d.y}%)`} />
            );
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
