"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

interface ShapeProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Triangle({ className, style }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <path d="M10 2L18 18H2L10 2Z" />
    </svg>
  );
}

export function Diamond({ className, style }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <path d="M10 2L18 10L10 18L2 10L10 2Z" />
    </svg>
  );
}

export function RoundedSquare({ className, style }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <rect x="2" y="2" width="16" height="16" rx="4" />
    </svg>
  );
}

export function SmallCircle({ className, style }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
}

const shapeColors = [
  "text-orange-400/17 dark:text-orange-400/12",
  "text-yellow-400/17 dark:text-yellow-400/12",
  "text-pink-400/17 dark:text-pink-400/12",
  "text-emerald-400/17 dark:text-emerald-400/12",
] as const;

const ShapeTypes = [Triangle, Diamond, RoundedSquare, SmallCircle] as const;

function generateShapes(count: number, jitter = 0.6, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * jitter;
    const y = 7.5 + row * cellH + Math.random() * cellH * jitter;
    const size = Math.floor((Math.random() * 18 + 11) * scale);
    const delay = (Math.random() * 5).toFixed(2);
    const colorIdx = Math.floor(Math.random() * shapeColors.length);
    const shapeIdx = Math.floor(Math.random() * ShapeTypes.length);
    result.push({
      id: i,
      Component: ShapeTypes[shapeIdx],
      x: x.toFixed(1) + "%",
      y: y.toFixed(1) + "%",
      size,
      color: shapeColors[colorIdx],
      delay: delay + "s",
    });
  }
  return result;
}

export default function FloatingShapes({ className, tight, scale = 1 }: { className?: string; tight?: boolean; scale?: number }) {
  const shapes = useMemo(() => generateShapes(tight ? 10 : 24, tight ? 0.3 : 0.6, scale), [tight, scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {shapes.map((shape) => {
        const Component = shape.Component;
        return (
          <Component
            key={shape.id}
            className={cn("absolute", shape.color)}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
              animationDelay: shape.delay,
            }}
          />
        );
      })}
    </div>
  );
}
