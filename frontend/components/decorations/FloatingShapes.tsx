"use client";

import { cn } from "@/lib/cn";

interface ShapeProps {
  className?: string;
  style?: React.CSSProperties;
}

function Triangle({ className, style }: ShapeProps) {
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

function Diamond({ className, style }: ShapeProps) {
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

function RoundedSquare({ className, style }: ShapeProps) {
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

function SmallCircle({ className, style }: ShapeProps) {
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

const shapes = [
  {
    id: 1,
    Component: Triangle,
    x: "5%",
    y: "20%",
    size: 16,
    color: "text-orange-400/20 dark:text-orange-400/18",
    delay: "0s",
  },
  {
    id: 2,
    Component: Diamond,
    x: "92%",
    y: "15%",
    size: 14,
    color: "text-yellow-400/20 dark:text-yellow-400/18",
    delay: "2s",
  },
  {
    id: 3,
    Component: RoundedSquare,
    x: "3%",
    y: "75%",
    size: 12,
    color: "text-pink-400/20 dark:text-pink-400/18",
    delay: "1s",
  },
  {
    id: 4,
    Component: SmallCircle,
    x: "95%",
    y: "80%",
    size: 10,
    color: "text-emerald-400/20 dark:text-emerald-400/18",
    delay: "3s",
  },
  {
    id: 5,
    Component: Triangle,
    x: "50%",
    y: "5%",
    size: 11,
    color: "text-orange-400/20 dark:text-orange-400/18",
    delay: "1.5s",
  },
  {
    id: 6,
    Component: Diamond,
    x: "40%",
    y: "92%",
    size: 13,
    color: "text-pink-400/20 dark:text-pink-400/15",
    delay: "2.5s",
  },
  {
    id: 7,
    Component: SmallCircle,
    x: "88%",
    y: "40%",
    size: 8,
    color: "text-yellow-400/20 dark:text-yellow-400/18",
    delay: "0.7s",
  },
  {
    id: 8,
    Component: RoundedSquare,
    x: "12%",
    y: "55%",
    size: 9,
    color: "text-emerald-400/20 dark:text-emerald-400/15",
    delay: "3.2s",
  },
];

export default function FloatingShapes({ className }: { className?: string }) {
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
