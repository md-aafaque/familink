"use client";

import { useMemo } from "react";

interface SoftShapesProps {
  accentColor: string;
  themeKey: string;
}

export default function SoftShapes({ accentColor, themeKey }: SoftShapesProps) {
  const elements = useMemo(() => {
    return [
      /* Top‑left — large faded orange circle */
      { type: "circle" as const, cx: 15, cy: 18, r: 32, opacity: 0.07, color: "#F97316", fill: true },
      /* Top‑right — yellow ring */
      { type: "circle" as const, cx: 85, cy: 15, r: 28, opacity: 0.06, color: "#FBBF24", fill: false },
      /* Bottom‑left — pink blob */
      { type: "circle" as const, cx: 10, cy: 85, r: 22, opacity: 0.07, color: "#F472B6", fill: true },
      /* Bottom‑right — blue blob */
      { type: "circle" as const, cx: 88, cy: 86, r: 24, opacity: 0.07, color: "#60A5FA", fill: true },
      /* Mid‑left — green ring */
      { type: "circle" as const, cx: 6, cy: 50, r: 14, opacity: 0.05, color: "#34D399", fill: false },
      /* Mid‑right — blue ring */
      { type: "circle" as const, cx: 92, cy: 45, r: 16, opacity: 0.04, color: "#60A5FA", fill: false },
      /* Center‑top — subtle accent hint */
      { type: "circle" as const, cx: 50, cy: 12, r: 8, opacity: 0.04, color: "#FBBF24", fill: false },
      /* Center‑bottom — subtle accent hint */
      { type: "circle" as const, cx: 45, cy: 90, r: 10, opacity: 0.04, color: "#F472B6", fill: false },
    ];
  }, []);

  return (
    <>
      {elements.map((e, i) => {
        if (e.fill) {
          return (
            <circle key={i} cx={`${e.cx}%`} cy={`${e.cy}%`} r={`${e.r}%`}
              fill={e.color} opacity={e.opacity} />
          );
        }
        return (
          <circle key={i} cx={`${e.cx}%`} cy={`${e.cy}%`} r={`${e.r}%`}
            fill="none" stroke={e.color} strokeWidth="0.4" opacity={e.opacity} />
        );
      })}
    </>
  );
}
