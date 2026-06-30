"use client";

import { cn } from "@/lib/cn";

function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <path d="M12 2C12 2 6 8 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 8 12 2 12 2Z" />
    </svg>
  );
}

function ConnectionNode({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn("pointer-events-none", className)}
      style={style}
    >
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="8" strokeDasharray="2 2" />
    </svg>
  );
}

function BranchLine({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 60 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={cn("pointer-events-none", className)}
      style={style}
    >
      <path d="M5 15H30M30 15L40 5M30 15L40 25" strokeDasharray="2 2" />
    </svg>
  );
}

export function Leaves({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      <Leaf
        className="absolute text-emerald-400/20 dark:text-emerald-400/15 w-6 h-6"
        style={{ top: "12%", right: "8%", animationDelay: "0s" }}
      />
      <Leaf
        className="absolute text-orange-400/20 dark:text-orange-400/15 w-4 h-4"
        style={{ top: "18%", right: "15%", animationDelay: "1.5s" }}
      />
      <Leaf
        className="absolute text-yellow-400/20 dark:text-yellow-400/15 w-5 h-5"
        style={{ bottom: "20%", left: "5%", animationDelay: "3s" }}
      />
    </div>
  );
}

export function ConnectionNodes({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      <ConnectionNode
        className="absolute text-orange-400/20 dark:text-orange-400/15 w-8 h-8"
        style={{ top: "30%", left: "5%" }}
      />
      <ConnectionNode
        className="absolute text-pink-400/20 dark:text-pink-400/15 w-6 h-6"
        style={{ top: "60%", right: "3%" }}
      />
      <ConnectionNode
        className="absolute text-emerald-400/20 dark:text-emerald-400/15 w-7 h-7"
        style={{ bottom: "40%", left: "8%" }}
      />
    </div>
  );
}

export function BranchDecorations({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      <BranchLine
        className="absolute text-orange-400/15 dark:text-orange-400/12 w-16 h-8"
        style={{ top: "25%", right: "2%" }}
      />
      <BranchLine
        className="absolute text-emerald-400/15 dark:text-emerald-400/12 w-20 h-10"
        style={{ bottom: "30%", left: "1%", transform: "rotate(-20deg)" }}
      />
    </div>
  );
}
