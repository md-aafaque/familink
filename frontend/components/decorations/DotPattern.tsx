"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface DotPatternProps {
  className?: string;
  fade?: boolean;
  size?: number;
  dotSize?: number;
  dotOpacity?: number;
  fadeEnd?: number;
}

export default function DotPattern({ className, fade = true, size = 20, dotSize = 1.5, dotOpacity = 0.09, fadeEnd = 112 }: DotPatternProps) {
  const uid = useId();
  return (
    <div className={cn("pointer-events-none absolute inset-0 hidden md:block", className)}>
      <svg className="w-full h-full" aria-hidden="true">
        <defs>
          <pattern id={`${uid}-p`} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
            <circle cx={size / 2} cy={size / 2} r={dotSize} fill={`hsl(221 39% 11% / ${dotOpacity})`} />
          </pattern>
          {fade && (
            <radialGradient id={`${uid}-g`} cx="50%" cy="50%" r="50%">
              <stop offset="20%" stopColor="white" stopOpacity="1" />
              <stop offset={`${fadeEnd}%`} stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>
        <rect
          width="100%" height="100%"
          fill={`url(#${uid}-p)`}
          mask={fade ? `url(#${uid}-m)` : undefined}
        />
        {fade && (
          <mask id={`${uid}-m`}>
            <rect width="100%" height="100%" fill={`url(#${uid}-g)`} />
          </mask>
        )}
      </svg>
    </div>
  );
}

export function DarkDotPattern({ className, fade = true, size = 20, dotSize = 1.5, dotOpacity = 0.065, fadeEnd = 112 }: DotPatternProps) {
  const uid = useId();
  return (
    <div className={cn("pointer-events-none absolute inset-0 hidden dark:md:block", className)}>
      <svg className="w-full h-full" aria-hidden="true">
        <defs>
          <pattern id={`${uid}-p`} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
            <circle cx={size / 2} cy={size / 2} r={dotSize} fill={`rgba(255,255,255,${dotOpacity})`} />
          </pattern>
          {fade && (
            <radialGradient id={`${uid}-g`} cx="50%" cy="50%" r="50%">
              <stop offset="20%" stopColor="white" stopOpacity="1" />
              <stop offset={`${fadeEnd}%`} stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>
        <rect
          width="100%" height="100%"
          fill={`url(#${uid}-p)`}
          mask={fade ? `url(#${uid}-m)` : undefined}
        />
        {fade && (
          <mask id={`${uid}-m`}>
            <rect width="100%" height="100%" fill={`url(#${uid}-g)`} />
          </mask>
        )}
      </svg>
    </div>
  );
}
