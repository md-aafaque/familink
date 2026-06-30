"use client";

interface DotGridProps {
  gridDotColor: string;
  themeKey: string;
}

export default function DotGrid({ gridDotColor, themeKey }: DotGridProps) {
  return (
    <defs>
      <pattern id={`bg-dots-${themeKey}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="0.5" cy="0.5" r={0.75} fill={gridDotColor} />
      </pattern>
    </defs>
  );
}
