"use client";

import { cn } from "@/lib/cn";

interface CircleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  noBlur?: boolean;
  scale?: number;
  style?: React.CSSProperties;
}

const sizes = {
  sm: "w-32 h-32",
  md: "w-56 h-56",
  lg: "w-80 h-80",
};

function CircleBase({ className, size = "md", noBlur, bg, scale = 1, style }: CircleProps & { bg: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        !noBlur && "blur-3xl",
        bg,
        sizes[size],
        "hidden md:block",
        className
      )}
      style={scale !== 1 || style ? { ...(scale !== 1 ? { transform: `scale(${scale})` } : {}), ...style } : undefined}
    />
  );
}

export function OrangeCircle(props: CircleProps) {
  return <CircleBase {...props} bg="bg-orange-500/11 dark:bg-[#F97316]/[0.09]" />;
}

export function YellowCircle(props: CircleProps) {
  return <CircleBase {...props} bg="bg-yellow-400/11 dark:bg-[#FBBF24]/[0.09]" />;
}

export function PinkCircle(props: CircleProps) {
  return <CircleBase {...props} bg="bg-pink-400/11 dark:bg-[#F472B6]/[0.09]" />;
}

export function GreenCircle(props: CircleProps) {
  return <CircleBase {...props} bg="bg-emerald-400/11 dark:bg-[#34D399]/[0.09]" />;
}

export function BlueCircle(props: CircleProps) {
  return <CircleBase {...props} bg="bg-blue-400/11 dark:bg-blue-400/[0.09]" />;
}

export function RingCircle({ className, size = "md", scale = 1, style }: CircleProps) {
  const ringSizes = { sm: "w-40 h-40", md: "w-64 h-64", lg: "w-96 h-96" };
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full border-2",
        "border-orange-300/17 dark:border-orange-400/11",
        ringSizes[size],
        "hidden md:block",
        className
      )}
      style={scale !== 1 || style ? { ...(scale !== 1 ? { transform: `scale(${scale})` } : {}), ...style } : undefined}
    />
  );
}

export function Semicircle({ className, scale = 1, style }: { className?: string; scale?: number; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute w-64 h-32 rounded-t-full",
        "bg-pink-400/11 dark:bg-pink-400/[0.09]",
        "hidden md:block",
        className
      )}
      style={scale !== 1 || style ? { ...(scale !== 1 ? { transform: `scale(${scale})` } : {}), ...style } : undefined}
    />
  );
}
