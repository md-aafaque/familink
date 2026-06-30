"use client";

import { cn } from "@/lib/cn";

interface DotPatternProps {
  className?: string;
  fade?: boolean;
  size?: number;
}

export default function DotPattern({ className, fade = true, size = 24 }: DotPatternProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        "bg-[image:radial-gradient(circle,hsl(var(--dot))_1px,transparent_1px)]",
        `bg-[length:${size}px_${size}px]`,
        fade && "[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]",
        "hidden md:block",
        className
      )}
      style={{ "--dot": "221 39% 11% / 0.15" } as React.CSSProperties}
    />
  );
}

export function DarkDotPattern({ className, fade = true, size = 24 }: DotPatternProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 hidden dark:md:block",
        "bg-[image:radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)]",
        `bg-[length:${size}px_${size}px]`,
        fade && "[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]",
        className
      )}
    />
  );
}
