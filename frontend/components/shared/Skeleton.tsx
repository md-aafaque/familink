"use client";

import { cn } from "../../lib/cn";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted rounded-lg", className)} />
  );
}
