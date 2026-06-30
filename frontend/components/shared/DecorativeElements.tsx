"use client";

import { cn } from "@/lib/cn";
import DotPattern from "../decorations/DotPattern";
import { OrangeStar, YellowStar, PinkStar } from "../decorations/DecorativeStars";
import { OrangeBlob, YellowBlob, PinkBlob, GreenBlob, BlueBlob } from "../decorations/DecorativeBlobs";
import { OrangeCircle, YellowCircle, PinkCircle, GreenCircle } from "../decorations/DecorativeCircles";

export {
  DotPattern,
  OrangeBlob,
  YellowBlob,
  PinkBlob,
  GreenBlob,
  BlueBlob,
  OrangeCircle,
  YellowCircle,
  PinkCircle,
  GreenCircle,
  OrangeStar,
  YellowStar,
  PinkStar,
};

export function FloatingStar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <OrangeStar className={className} style={style} size={16} />;
}

export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn("pointer-events-none text-primary/10 dark:text-primary/5", className)}
    >
      <path d="M0 10 Q12.5 0, 25 10 T50 10 T75 10 T100 10" />
    </svg>
  );
}
