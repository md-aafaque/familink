"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

interface StarProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

function Star({ className, style, size = 16 }: StarProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
      style={style}
      className={cn("pointer-events-none animate-float", className)}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function OrangeStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-orange-400/19 dark:text-orange-400/14", className)}
      style={style}
      size={size}
    />
  );
}

export function YellowStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-yellow-400/19 dark:text-yellow-400/14", className)}
      style={style}
      size={size}
    />
  );
}

export function PinkStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-pink-400/19 dark:text-pink-400/14", className)}
      style={style}
      size={size}
    />
  );
}

const starColors = ["orange", "yellow", "pink"] as const;

function generateStars(count: number, jitter = 0.6, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const stars = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * jitter;
    const y = 7.5 + row * cellH + Math.random() * cellH * jitter;
    const size = Math.floor((Math.random() * 25 + 11) * scale);
    const delay = (Math.random() * 5).toFixed(2);
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    stars.push({ color, x: x.toFixed(1) + "%", y: y.toFixed(1) + "%", size, delay: delay + "s" });
  }
  return stars;
}

const StarComponent = {
  orange: OrangeStar,
  yellow: YellowStar,
  pink: PinkStar,
};

export function ScatteredStars({ className, tight, scale = 1 }: { className?: string; tight?: boolean; scale?: number }) {
  const stars = useMemo(() => generateStars(tight ? 18 : 42, tight ? 0.3 : 0.6, scale), [tight, scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {stars.map((star, i) => {
        const Component = StarComponent[star.color];
        return (
          <Component
            key={i}
            className="absolute"
            style={{
              left: star.x,
              top: star.y,
              animationDelay: star.delay,
            }}
            size={star.size}
          />
        );
      })}
    </div>
  );
}
