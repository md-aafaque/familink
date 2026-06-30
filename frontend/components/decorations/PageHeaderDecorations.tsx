"use client";

import { cn } from "@/lib/cn";

interface PageHeaderDecorationsProps {
  className?: string;
  variant?: "default" | "rich" | "minimal";
}

export default function PageHeaderDecorations({ className, variant = "default" }: PageHeaderDecorationsProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-primary/5 dark:bg-primary/[0.06] blur-2xl" />
        <div className="absolute -top-8 -right-8 w-16 h-16 rounded-full bg-yellow-400/5 dark:bg-yellow-400/[0.06] blur-xl" />
      </div>
    );
  }

  if (variant === "rich") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
        <div className="absolute -top-24 -right-16 w-48 h-48 rounded-full bg-primary/8 dark:bg-primary/[0.08] blur-3xl" />
        <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-yellow-400/6 dark:bg-yellow-400/[0.06] blur-2xl" />
        <div className="absolute top-8 left-1/4 w-4 h-4 rounded-full bg-pink-400/20 dark:bg-pink-400/15 blur-sm" />
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute top-4 right-1/4 w-3 h-3 text-yellow-400/20 dark:text-yellow-400/15 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -top-16 -right-12 w-32 h-32 rounded-full bg-primary/8 dark:bg-primary/[0.08] blur-3xl" />
      <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-yellow-400/5 dark:bg-yellow-400/[0.06] blur-2xl" />
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="absolute top-2 right-1/3 w-3 h-3 text-pink-400/20 dark:text-pink-400/15 animate-float"
        style={{ animationDelay: "0.5s" }}
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </div>
  );
}
