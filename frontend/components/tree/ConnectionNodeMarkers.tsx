"use client";

import { useMemo, useState } from "react";

interface ConnectionMarkersProps {
  connectors: LayoutConnector[];
  lineColor: string;
  accentColor: string;
  themeKey: string;
}

interface LayoutConnector {
  id: string;
  p1x: number;
  p2x: number;
  parentBottomY: number;
  childXs: number[];
  childTopY: number;
  collapsed?: boolean;
}

/**
 * Renders small decorative nodes at connector intersection points.
 * One node at the parent union centre, and one per child branch.
 */
export default function ConnectionNodeMarkers({
  connectors, lineColor, accentColor, themeKey,
}: ConnectionMarkersProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const markers = useMemo(() => {
    const result: Array<{
      key: string;
      cx: number;
      cy: number;
      isUnion: boolean;
    }> = [];

    for (const c of connectors) {
      if (c.collapsed) continue;

      // Union centre marker
      const unionX = (c.p1x + c.p2x) / 2;
      result.push({
        key: `union-${c.id}`,
        cx: unionX,
        cy: c.parentBottomY,
        isUnion: true,
      });

      // Child branch markers
      for (let i = 0; i < c.childXs.length; i++) {
        result.push({
          key: `child-${c.id}-${i}`,
          cx: c.childXs[i],
          cy: c.childTopY,
          isUnion: false,
        });
      }
    }
    return result;
  }, [connectors]);

  return (
    <g>
      {markers.map((m) => {
        const isHovered = hoveredId === m.key;
        return (
          <g key={m.key}
            onMouseEnter={() => setHoveredId(m.key)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Outer glow ring */}
            {isHovered && (
              <circle
                cx={m.cx} cy={m.cy} r={6}
                fill="none" stroke={accentColor}
                strokeWidth={1.5} opacity={0.5}
              >
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Marker dot */}
            <circle
              cx={m.cx} cy={m.cy} r={isHovered ? 3.5 : 2.5}
              fill={isHovered ? accentColor : lineColor}
              stroke={themeKey === "dark" ? "#0d1117" : "#fff"}
              strokeWidth={1}
              style={{ transition: "r 0.2s, fill 0.2s" }}
            />
            {/* Spouse (union) markers get a double-ring */}
            {m.isUnion && (
              <circle
                cx={m.cx} cy={m.cy} r={4}
                fill="none" stroke={accentColor}
                strokeWidth={0.8} opacity={0.35}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
