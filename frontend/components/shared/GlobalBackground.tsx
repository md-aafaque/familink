"use client";

import { useAppTheme } from "../providers/ThemeProvider";

export default function GlobalBackground() {
  const { theme } = useAppTheme();
  const { canvas, grid } = theme.colors.tree;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundColor: canvas }}>
      <svg className="w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="global-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="0.5" cy="0.5" r={0.75} fill={grid} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#global-dots)" />
      </svg>
    </div>
  );
}
