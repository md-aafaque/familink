"use client";

import { useState, useMemo } from "react";

interface LayoutConnector {
  id: string;
  p1x: number;
  p2x: number;
  parentBottomY: number;
  childXs: number[];
  childTopY: number;
  collapsed?: boolean;
}

interface ConnectionLineProps {
  connectors: LayoutConnector[];
  lineColor: string;
  spouseColor: string;
  themeKey: string;
}

const CARD_W = 260;
const CARD_H = 100;

/* Spec colours */
const MARRIAGE  = "#F472B6";
const PARENT_CHILD = "#F97316";
const EXTENDED  = "#60A5FA";
const SPECIAL   = "#34D399";

/* Per‑child colours cycle through the spec accent palette */
const CHILD_COLORS = [PARENT_CHILD, SPECIAL, EXTENDED, "#FBBF24", "#A78BFA"];

function getChildColor(index: number): string {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}

export default function ConnectionLine({
  connectors, lineColor, spouseColor, themeKey,
}: ConnectionLineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* Collect connection-intersection markers */
  const markers = useMemo(() => {
    const result: Array<{
      key: string;
      cx: number;
      cy: number;
      isUnion: boolean;
      color: string;
    }> = [];

    for (const c of connectors) {
      const unionX = (c.p1x + c.p2x) / 2;
      const hasSpouse = c.p1x !== c.p2x;
      result.push({
        key: `union-${c.id}`,
        cx: unionX,
        cy: hasSpouse ? c.parentBottomY - CARD_H / 2 : c.parentBottomY,
        isUnion: true,
        color: hasSpouse ? MARRIAGE : PARENT_CHILD,
      });
      for (let i = 0; i < c.childXs.length; i++) {
        result.push({
          key: `child-${c.id}-${i}`,
          cx: c.childXs[i],
          cy: c.childTopY,
          isUnion: false,
          color: getChildColor(i),
        });
      }
    }
    return result;
  }, [connectors]);

  /* Is any marker in this connector group hovered? */
  const isAnyRelated = useMemo(() => {
    if (!hoveredId) return null;
    const [prefix, connId] = hoveredId.includes("-")
      ? [hoveredId.split("-")[0], hoveredId.slice(hoveredId.indexOf("-") + 1)]
      : [null, null];
    if (!connId) return null;
    return connId;
  }, [hoveredId]);

  return (
    <>
      {connectors.map(c => {
        const hasSpouse = c.p1x !== c.p2x;
        const p1RX   = c.p1x + CARD_W / 2;
        const p2LX   = c.p2x - CARD_W / 2;
        const unionX = hasSpouse ? (p1RX + p2LX) / 2 : c.p1x;
        const isHovered = hoveredId === c.id || isAnyRelated === c.id;
        const parentCY = hasSpouse ? c.parentBottomY - CARD_H / 2 : c.parentBottomY;
        const connectorOpacity = hoveredId && !isHovered ? 0.3 : 1;

        return (
          <g key={c.id}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="connection-line"
            opacity={connectorOpacity}
            style={{ transition: "opacity 0.25s" }}
          >
            {/* Spouse line */}
            {hasSpouse && (
              <path
                d={`M ${p1RX} ${parentCY} Q ${(p1RX + p2LX) / 2} ${parentCY} ${p2LX} ${parentCY}`}
                fill="none"
                stroke={MARRIAGE}
                strokeWidth={isHovered ? 4 : 3}
                strokeDasharray="7 4"
                strokeLinecap="round"
                style={{ transition: "stroke-width 0.2s" }}
              />
            )}

            {/* Single child */}
            {c.childXs.length === 1 && (
              <path
                d={`M ${unionX} ${parentCY}
                    C ${unionX} ${(parentCY + c.childTopY) / 2},
                      ${c.childXs[0]} ${(parentCY + c.childTopY) / 2},
                      ${c.childXs[0]} ${c.childTopY}`}
                fill="none"
                stroke={getChildColor(0)}
                strokeWidth={isHovered ? 4 : 3}
                strokeLinecap="round"
                style={{ transition: "stroke-width 0.2s" }}
              />
            )}

            {/* Multiple children */}
            {c.childXs.length > 1 && (
              <>
                <path
                  d={`M ${unionX} ${parentCY}
                      Q ${unionX} ${parentCY + (c.childTopY - parentCY) * 0.35},
                        ${unionX} ${parentCY + (c.childTopY - parentCY) * 0.35}`}
                  fill="none"
                  stroke={PARENT_CHILD}
                  strokeWidth={isHovered ? 4 : 3}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 0.2s" }}
                />
                {c.childXs.map((cx, i) => {
                  const stemEndY = parentCY + (c.childTopY - parentCY) * 0.35;
                  return (
                    <path key={i}
                      d={`M ${unionX} ${stemEndY}
                          C ${(unionX + cx) / 2} ${stemEndY},
                            ${(unionX + cx) / 2} ${c.childTopY},
                            ${cx} ${c.childTopY}`}
                      fill="none"
                      stroke={getChildColor(i)}
                      strokeWidth={isHovered ? 4 : 3}
                      strokeLinecap="round"
                      style={{ transition: "stroke-width 0.2s" }}
                    />
                  );
                })}
              </>
            )}

            {c.collapsed && (
              <line x1={unionX} y1={parentCY} x2={unionX} y2={c.parentBottomY + 6}
                stroke={PARENT_CHILD} strokeWidth={3} strokeLinecap="round" />
            )}
          </g>
        );
      })}

      {/* Connection‑node markers — 12px, white fill, coloured border */}
      {markers.map((m) => {
        const isMarkerHovered = hoveredId === m.key;
        const markerOpacity = hoveredId && !isMarkerHovered ? 0.3 : 1;

        return (
          <g key={m.key}
            onMouseEnter={() => setHoveredId(m.key)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: "pointer", opacity: markerOpacity, transition: "opacity 0.25s" }}
          >
            {/* Glow ring on hover */}
            {isMarkerHovered && (
              <circle cx={m.cx} cy={m.cy} r={10}
                fill="none" stroke={m.color} strokeWidth={2} opacity={0.35}
                className="animate-pulse-glow" />
            )}
            {/* Main 12px node — white fill, coloured 2px border */}
            <circle cx={m.cx} cy={m.cy} r={6}
              fill="#ffffff" stroke={m.color} strokeWidth={2.5}
              style={{ transition: "r 0.2s" }}
            />
            {m.isUnion && (
              <circle cx={m.cx} cy={m.cy} r={8}
                fill="none" stroke={m.color} strokeWidth={1} opacity={0.3} />
            )}
          </g>
        );
      })}
    </>
  );
}
