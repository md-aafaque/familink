"use client";

import { cn } from "@/lib/cn";
import DotPattern, { DarkDotPattern } from "./DotPattern";
import FloatingShapes from "./FloatingShapes";
import { ScatteredStars } from "./DecorativeStars";
import { Leaves, ConnectionNodes, BranchDecorations } from "./FamilyDecorations";
import { OrangeCircle, RingCircle } from "./DecorativeCircles";
import { PinkBlob } from "./DecorativeBlobs";

interface CanvasBackgroundProps {
  className?: string;
  dotGrid?: boolean;
  circles?: boolean;
  blobs?: boolean;
  stars?: boolean;
  floatingShapes?: boolean;
  familyDecorations?: boolean;
}

/**
 * Decorative background for the Tree Canvas, scoped to the canvas
 * panel only. Follows the same composition pattern as PageBackground,
 * but is `absolute` (not `fixed`) so it stays inside the canvas
 * container instead of bleeding under the Sandbox Panel or Profile
 * Drawer.
 *
 * Requires the canvas wrapper to be `position: relative` and to
 * already carry the app's normal page background color/token
 * underneath this (this component is the decorative layer only,
 * it doesn't set a base fill itself).
 */
export default function CanvasBackground({
  className,
  dotGrid = true,
  circles = true,
  blobs = true,
  stars = true,
  floatingShapes = true,
  familyDecorations = true,
}: CanvasBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden z-0",
        className
      )}
    >
      {/* Dot grid — DotPattern/DarkDotPattern handle their own
          light/dark visibility internally, same as PageBackground */}
      {dotGrid && (
        <>
          <DotPattern fade />
          <DarkDotPattern fade />
        </>
      )}

      {/* One large faded circle + one faint ring, anchored to opposite
          corners so they never sit behind a node card's text */}
      {circles && (
        <>
          <OrangeCircle className="-top-16 -right-16" size="lg" />
          <RingCircle className="bottom-10 left-10" size="md" />
        </>
      )}

      {/* Single soft blob anchoring the bottom-left corner */}
      {blobs && <PinkBlob className="-bottom-32 -left-32" size="lg" />}

      {/* Small triangle / misc geometric accents, sparse */}
      {floatingShapes && <FloatingShapes />}

      {/* Small scattered stars/sparkles across the open canvas space */}
      {stars && <ScatteredStars />}

      {/* Family-tree motifs: leaves, connection-node dots, branch lines */}
      {familyDecorations && (
        <>
          <Leaves />
          <ConnectionNodes />
          <BranchDecorations />
        </>
      )}
    </div>
  );
}