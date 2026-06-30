"use client";

import { cn } from "@/lib/cn";

interface StarProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

function Star({ className, style, size = 16 }: StarProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
      style={style}
      className={cn("pointer-events-none animate-float", className)}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function OrangeStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-orange-400/25 dark:text-orange-400/15", className)}
      style={style}
      size={size}
    />
  );
}

export function YellowStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-yellow-400/25 dark:text-yellow-400/15", className)}
      style={style}
      size={size}
    />
  );
}

export function PinkStar({ className, style, size = 12 }: StarProps) {
  return (
    <Star
      className={cn("text-pink-400/25 dark:text-pink-400/15", className)}
      style={style}
      size={size}
    />
  );
}

const starColors = ["orange", "yellow", "pink"] as const;

const defaultStars = [
  { color: "orange" as const, x: "10%", y: "15%", size: 14, delay: "0s" },
  { color: "yellow" as const, x: "85%", y: "20%", size: 10, delay: "1.5s" },
  { color: "pink" as const, x: "20%", y: "80%", size: 12, delay: "3s" },
  { color: "orange" as const, x: "75%", y: "70%", size: 16, delay: "0.8s" },
  { color: "yellow" as const, x: "50%", y: "10%", size: 8, delay: "2.2s" },
  { color: "pink" as const, x: "90%", y: "50%", size: 10, delay: "1s" },
  { color: "orange" as const, x: "5%", y: "50%", size: 12, delay: "2.5s" },
  { color: "yellow" as const, x: "65%", y: "85%", size: 14, delay: "0.3s" },
  { color: "pink" as const, x: "35%", y: "25%", size: 9, delay: "1.8s" },
  { color: "orange" as const, x: "45%", y: "90%", size: 11, delay: "3.5s" },
  { color: "yellow" as const, x: "15%", y: "40%", size: 13, delay: "0.5s" },
  { color: "pink" as const, x: "80%", y: "5%", size: 8, delay: "2.8s" },
];

const StarComponent = {
  orange: OrangeStar,
  yellow: YellowStar,
  pink: PinkStar,
};

export function ScatteredStars({ count, className }: { count?: number; className?: string }) {
  const stars = count ? defaultStars.slice(0, count) : defaultStars;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {stars.map((star, i) => {
        const Component = StarComponent[star.color];
        return (
          <Component
            key={i}
            className="absolute"
            style={{
              left: star.x,
              top: star.y,
              animationDelay: star.delay,
            }}
            size={star.size}
          />
        );
      })}
    </div>
  );
}
