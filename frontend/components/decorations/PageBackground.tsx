"use client";

import { cn } from "@/lib/cn";
import DotPattern, { DarkDotPattern } from "./DotPattern";
import FloatingShapes from "./FloatingShapes";
import { ScatteredStars } from "./DecorativeStars";
import ConfettiElements from "./ConfettiElements";
import { Leaves, ConnectionNodes, BranchDecorations } from "./FamilyDecorations";
import { OrangeCircle, YellowCircle, PinkCircle, GreenCircle, RingCircle, Semicircle } from "./DecorativeCircles";
import { OrangeBlob, YellowBlob, PinkBlob, GreenBlob, BlueBlob } from "./DecorativeBlobs";
import PageHeaderDecorations from "./PageHeaderDecorations";

interface PageBackgroundProps {
  className?: string;
  dotGrid?: boolean;
  floatingShapes?: boolean;
  stars?: boolean;
  confetti?: boolean;
  familyDecorations?: boolean;
  circles?: boolean;
  blobs?: boolean;
  variant?: "default" | "dashboard" | "auth" | "admin" | "minimal";
  headerDecoration?: boolean | "default" | "rich" | "minimal";
}

export default function PageBackground({
  className,
  dotGrid = true,
  floatingShapes = false,
  stars = true,
  confetti = false,
  familyDecorations = false,
  circles = true,
  blobs = true,
  variant = "default",
  headerDecoration = false,
}: PageBackgroundProps) {
  const preset = variant === "dashboard"
    ? { circles: true, blobs: true, stars: true, floatingShapes: true, confetti: true, familyDecorations: true }
    : variant === "auth"
    ? { circles: true, blobs: true, stars: true, floatingShapes: false, confetti: false, familyDecorations: false }
    : variant === "admin"
    ? { circles: true, blobs: true, stars: true, floatingShapes: false, confetti: false, familyDecorations: false }
    : variant === "minimal"
    ? { circles: false, blobs: false, stars: true, floatingShapes: false, confetti: false, familyDecorations: false }
    : { circles, blobs, stars, floatingShapes, confetti, familyDecorations };

  return (
    <div className={cn("pointer-events-none fixed inset-0 overflow-hidden z-0", className)}>
      {/* Dot grid background */}
      {dotGrid && (
        <>
          <DotPattern fade />
          <DarkDotPattern fade />
        </>
      )}

      {/* Large faded circles */}
      {preset.circles && (
        <>
          <OrangeCircle className="-top-24 -right-24" size="lg" />
          <PinkCircle className="top-1/3 -left-32" size="md" />
          <YellowCircle className="bottom-0 right-1/4" size="lg" />
          <GreenCircle className="-bottom-32 left-1/3" size="md" />
          <RingCircle className="top-1/4 left-1/2 -translate-x-1/2" size="lg" />
          <Semicircle className="bottom-0 right-0" />
        </>
      )}

      {/* Blobs */}
      {preset.blobs && (
        <>
          <OrangeBlob className="-top-48 -right-48" size="lg" />
          <YellowBlob className="-bottom-48 -left-48" size="lg" />
          <PinkBlob className="top-1/2 -right-24" size="md" />
          <GreenBlob className="-bottom-32 left-1/4" size="md" />
          <BlueBlob className="top-1/3 -left-24" size="sm" />
        </>
      )}

      {/* Floating shapes */}
      {preset.floatingShapes && <FloatingShapes />}

      {/* Scattered stars */}
      {preset.stars && <ScatteredStars />}

      {/* Confetti elements */}
      {preset.confetti && <ConfettiElements count={6} />}

      {/* Family decorations */}
      {preset.familyDecorations && (
        <>
          <Leaves />
          <ConnectionNodes />
          <BranchDecorations />
        </>
      )}

      {/* Page header decoration */}
      {headerDecoration && (
        <PageHeaderDecorations
          variant={headerDecoration === true ? "default" : headerDecoration}
        />
      )}
    </div>
  );
}

export {
  DotPattern,
  FloatingShapes,
  ScatteredStars,
  ConfettiElements,
  Leaves,
  ConnectionNodes,
  BranchDecorations,
  OrangeCircle,
  YellowCircle,
  PinkCircle,
  GreenCircle,
  RingCircle,
  Semicircle,
  OrangeBlob,
  YellowBlob,
  PinkBlob,
  GreenBlob,
  BlueBlob,
  PageHeaderDecorations,
};
