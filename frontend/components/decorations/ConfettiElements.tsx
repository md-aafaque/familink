"use client";

import { cn } from "@/lib/cn";

interface ConfettiDot {
  color: string;
  x: string;
  y: string;
  size: number;
  delay: string;
}

const confettiDots: ConfettiDot[] = [
  { color: "bg-orange-400/20 dark:bg-orange-400/15", x: "10%", y: "20%", size: 4, delay: "0s" },
  { color: "bg-yellow-400/20 dark:bg-yellow-400/15", x: "80%", y: "15%", size: 3, delay: "0.5s" },
  { color: "bg-pink-400/20 dark:bg-pink-400/15", x: "15%", y: "70%", size: 5, delay: "1s" },
  { color: "bg-emerald-400/20 dark:bg-emerald-400/15", x: "85%", y: "75%", size: 3, delay: "1.5s" },
  { color: "bg-orange-400/18 dark:bg-orange-400/12", x: "50%", y: "10%", size: 4, delay: "2s" },
  { color: "bg-yellow-400/18 dark:bg-yellow-400/12", x: "60%", y: "85%", size: 3, delay: "0.8s" },
  { color: "bg-pink-400/18 dark:bg-pink-400/12", x: "30%", y: "90%", size: 4, delay: "2.5s" },
  { color: "bg-emerald-400/18 dark:bg-emerald-400/12", x: "70%", y: "25%", size: 3, delay: "1.2s" },
  { color: "bg-orange-400/18 dark:bg-orange-400/12", x: "5%", y: "50%", size: 3, delay: "3s" },
  { color: "bg-yellow-400/18 dark:bg-yellow-400/12", x: "95%", y: "50%", size: 4, delay: "0.3s" },
  { color: "bg-pink-400/18 dark:bg-pink-400/12", x: "40%", y: "5%", size: 3, delay: "1.8s" },
  { color: "bg-emerald-400/18 dark:bg-emerald-400/12", x: "55%", y: "95%", size: 4, delay: "2.2s" },
];

export default function ConfettiElements({ className, count }: { className?: string; count?: number }) {
  const dots = count ? confettiDots.slice(0, count) : confettiDots;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {dots.map((dot, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full animate-confetti", dot.color)}
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}
