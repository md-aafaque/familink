"use client";

import { cn } from "@/lib/cn";

interface CircleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-32 h-32",
  md: "w-56 h-56",
  lg: "w-80 h-80",
};

export function OrangeCircle({ className, size = "md" }: CircleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        "bg-orange-500/15 dark:bg-[#F97316]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function YellowCircle({ className, size = "md" }: CircleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        "bg-yellow-400/15 dark:bg-[#FBBF24]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function PinkCircle({ className, size = "md" }: CircleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        "bg-pink-400/15 dark:bg-[#F472B6]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function GreenCircle({ className, size = "md" }: CircleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        "bg-emerald-400/15 dark:bg-[#34D399]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function BlueCircle({ className, size = "md" }: CircleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        "bg-blue-400/15 dark:bg-blue-400/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function RingCircle({ className, size = "md" }: CircleProps) {
  const ringSizes = { sm: "w-40 h-40", md: "w-64 h-64", lg: "w-96 h-96" };
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full border-2",
        "border-orange-300/30 dark:border-orange-400/20",
        ringSizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function Semicircle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute w-64 h-32 rounded-t-full",
        "bg-pink-400/15 dark:bg-pink-400/[0.12]",
        "hidden md:block",
        className
      )}
    />
  );
}
