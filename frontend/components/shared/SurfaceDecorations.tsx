"use client";

interface SurfaceDecorationsProps {
  className?: string;
  density?: "light" | "medium";
  variant?: "modal" | "sidebar";
}

const DOT_POSITIONS_LIGHT = [
  [10, 18], [85, 22], [20, 80], [78, 78], [45, 8], [55, 92],
  [90, 50], [8, 55],
];

const DOT_POSITIONS_MEDIUM = [
  [10, 18], [85, 22], [20, 80], [78, 78], [45, 8], [55, 92],
  [90, 50], [8, 55], [30, 35], [65, 40], [40, 65], [70, 15],
  [15, 42], [82, 65], [50, 50], [25, 10],
];

const DOT_COLORS = ["#F97316", "#FBBF24", "#F472B6", "#34D399"];

export default function SurfaceDecorations({ className, density = "medium", variant }: SurfaceDecorationsProps) {
  const dots = density === "light" ? DOT_POSITIONS_LIGHT : DOT_POSITIONS_MEDIUM;
  const sidebar = variant === "sidebar";

  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className || ""}`} aria-hidden="true">
      {sidebar ? (
        <>
          <circle cx="8%" cy="6%" r="14%" fill="#F97316" opacity="0.04" />
          <circle cx="92%" cy="92%" r="10%" fill="none" stroke="#FBBF24" strokeWidth="0.5" opacity="0.05" />
          <circle cx="5%" cy="88%" r="8%" fill="#F472B6" opacity="0.035" />
          <circle cx="90%" cy="10%" r="6%" fill="none" stroke="#34D399" strokeWidth="0.3" opacity="0.04" />
        </>
      ) : (
        <>
          <circle cx="8%" cy="6%" r="10%" fill="#F97316" opacity="0.04" />
          <circle cx="92%" cy="8%" r="7%" fill="none" stroke="#FBBF24" strokeWidth="0.4" opacity="0.05" />
          <circle cx="5%" cy="92%" r="6%" fill="#F472B6" opacity="0.035" />
          <circle cx="90%" cy="88%" r="8%" fill="none" stroke="#34D399" strokeWidth="0.3" opacity="0.035" />
        </>
      )}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r={`${0.4 + (i % 3) * 0.3}%`}
          fill={DOT_COLORS[i % DOT_COLORS.length]} opacity={0.04 + (i % 4) * 0.01} />
      ))}
      {!sidebar && (
        <>
          <polygon points="15%,22% 15.4%,21.2% 15.8%,22% 14.8%,21.6% 15.6%,21.6%" fill="#FBBF24" opacity="0.05" />
          <polygon points="80%,12% 80.4%,11.2% 80.8%,12% 79.8%,11.6% 80.6%,11.6%" fill="#F472B6" opacity="0.04" />
          <polygon points="12%,70% 12.4%,69.2% 12.8%,70% 11.8%,69.6% 12.6%,69.6%" fill="#34D399" opacity="0.045" />
          <polygon points="85%,75% 85.4%,74.2% 85.8%,75% 84.8%,74.6% 85.6%,74.6%" fill="#F97316" opacity="0.04" />
        </>
      )}
    </svg>
  );
}
