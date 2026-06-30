"use client";

import { cn } from "@/lib/cn";

interface BlobProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-48 h-48 blur-2xl",
  md: "w-72 h-72 blur-[100px]",
  lg: "w-96 h-96 blur-[120px]",
};

export function OrangeBlob({ className, size = "md" }: BlobProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        "bg-primary/15 dark:bg-[#F97316]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function YellowBlob({ className, size = "md" }: BlobProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        "bg-yellow-400/15 dark:bg-[#FBBF24]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function PinkBlob({ className, size = "md" }: BlobProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        "bg-pink-400/15 dark:bg-[#F472B6]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function GreenBlob({ className, size = "md" }: BlobProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        "bg-emerald-400/15 dark:bg-[#34D399]/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function BlueBlob({ className, size = "md" }: BlobProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        "bg-blue-400/15 dark:bg-blue-400/[0.12]",
        sizes[size],
        "hidden md:block",
        className
      )}
    />
  );
}

export function BlobShape({ className, size = "md" }: BlobProps) {
  const blobSizes = { sm: "w-32 h-32", md: "w-48 h-48", lg: "w-64 h-64" };
  return (
    <div
      className={cn(
        "pointer-events-none absolute",
        "bg-primary/15 dark:bg-primary/[0.12]",
        blobSizes[size],
        "blob-mask",
        "hidden md:block",
        className
      )}
    />
  );
}
