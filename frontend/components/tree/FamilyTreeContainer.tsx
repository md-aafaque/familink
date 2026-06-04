"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import ProfileDrawer from "./ProfileDrawer";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Heart, ChevronRight, ChevronLeft,
  Search, Maximize2, Minimize2, X,
  Leaf, Grid3X3, ScrollText, Moon, ZoomIn, ZoomOut, RotateCcw,
  Users, ChevronDown, ImageDown, FileDown,
} from "lucide-react";
import TreeSandboxSidebar from "./TreeSandboxSidebar";
import RelationshipProposalModal from "../RelationshipProposalModal";
import { useRouter } from "next/navigation";
import CreatePersonModal from "../CreatePersonModal";
import { cn } from "@/lib/cn";
import { useTreeInteraction } from "./TreeInteractionProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface FamilyTreeProps { treeId: string }

interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  status?: string;
  birthDate?: string;
  deathDate?: string;
  relationships: Array<{ type: string; targetId: string }>;
}

interface Union {
  id: string;
  partner1Id: string;
  partner2Id: string | null;
  childrenIds: string[];
}

interface LayoutConnector {
  id: string;
  p1x: number;
  p2x: number;
  parentBottomY: number;
  childXs: number[];
  childTopY: number;
}

interface LayoutResult {
  nodes: Map<string, { x: number; y: number }>;
  connectors: LayoutConnector[];
  totalWidth: number;
  totalHeight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Constants
// ─────────────────────────────────────────────────────────────────────────────
const CARD_W      = 176;
const CARD_H      = 68;
const H_GAP       = 72;
const V_GAP       = 112;
const SPOUSE_GAP  = 48;
const COUPLE_W    = CARD_W + SPOUSE_GAP + CARD_W;
const PADDING     = 240;
const SIDEBAR_W   = 280;
const INITIAL_SCALE = 0.65;

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    name: "Light", Icon: Grid3X3,
    canvas: "#f1f5f9",
    gridDot: "#c8d5e3",
    dotR: 0.85,
    line: "#94a3b8", spouseLine: "#818cf8",
    accent: "#6366f1",
    panel:   "bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm",
    toolbar: "bg-white/85 backdrop-blur-xl border border-slate-200/70 shadow-lg shadow-slate-200/50",
    text: "text-slate-800", muted: "text-slate-400",
    chipOn:  "bg-indigo-600 text-white",
    chipOff: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    iconBtn: "bg-white/80 backdrop-blur-xl border border-slate-200/70 shadow-sm text-slate-500 hover:text-slate-800",
    cardBg:  "bg-white", cardBorder: "border-slate-200/90",
  },
  dark: {
    name: "Dark", Icon: Moon,
    canvas: "#0d1117",
    gridDot: "#1a2233",
    dotR: 0.75,
    line: "#263045", spouseLine: "#f59e0b",
    accent: "#f59e0b",
    panel:   "bg-[#161d2e]/90 backdrop-blur-xl border border-slate-700/50 shadow-md shadow-black/30",
    toolbar: "bg-[#161d2e]/95 backdrop-blur-xl border border-slate-700/40 shadow-xl shadow-black/50",
    text: "text-slate-100", muted: "text-slate-500",
    chipOn:  "bg-amber-500 text-slate-900",
    chipOff: "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
    iconBtn: "bg-[#161d2e]/90 backdrop-blur-xl border border-slate-700/50 shadow-sm text-slate-400 hover:text-slate-100",
    cardBg:  "bg-[#161d2e]", cardBorder: "border-slate-700/60",
  },
  sepia: {
    name: "Sepia", Icon: ScrollText,
    canvas: "#f8f2e3",
    gridDot: "#d9c9a3",
    dotR: 0.9,
    line: "#b09070", spouseLine: "#c17a3a",
    accent: "#9a6b2e",
    panel:   "bg-[#fdfaf0]/90 backdrop-blur-xl border border-amber-200/60 shadow-sm shadow-amber-100/30",
    toolbar: "bg-[#fdfaf0]/95 backdrop-blur-xl border border-amber-300/50 shadow-lg shadow-amber-100/40",
    text: "text-stone-800", muted: "text-stone-400",
    chipOn:  "bg-amber-700 text-white",
    chipOff: "text-amber-700 hover:bg-amber-100 hover:text-amber-900",
    iconBtn: "bg-[#fdfaf0]/90 backdrop-blur-xl border border-amber-200/60 shadow-sm text-stone-400 hover:text-stone-800",
    cardBg:  "bg-[#fdfaf0]", cardBorder: "border-amber-200/70",
  },
  forest: {
    name: "Forest", Icon: Leaf,
    canvas: "#ecf5ec",
    gridDot: "#b0ccb0",
    dotR: 0.85,
    line: "#68966a", spouseLine: "#34d399",
    accent: "#16a34a",
    panel:   "bg-white/85 backdrop-blur-xl border border-emerald-200/60 shadow-sm shadow-emerald-100/30",
    toolbar: "bg-white/90 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-100/40",
    text: "text-emerald-950", muted: "text-emerald-600",
    chipOn:  "bg-emerald-600 text-white",
    chipOff: "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800",
    iconBtn: "bg-white/85 backdrop-blur-xl border border-emerald-200/60 shadow-sm text-emerald-400 hover:text-emerald-800",
    cardBg:  "bg-white", cardBorder: "border-emerald-200/70",
  },
} as const;

type ThemeKey = keyof typeof THEMES;
type Theme    = (typeof THEMES)[ThemeKey];

// ─────────────────────────────────────────────────────────────────────────────
// Theme background SVG decorations
// These render inside the export div so they appear in downloads.
// ─────────────────────────────────────────────────────────────────────────────
function ThemeBackground({ themeKey, t, w, h }: { themeKey: ThemeKey; t: Theme; w: number; h: number }) {
  const cx = w / 2, cy = h / 2;

  const decorations: Record<ThemeKey, React.ReactNode> = {
    // Light: Clean radial highlight from top-centre — feels like natural daylight
    light: (
      <>
        <defs>
          <radialGradient id="bg-light-top" cx="50%" cy="0%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="bg-light-centre" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#e0e7ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0"    />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-light-top)"    />
        <rect width={w} height={h} fill="url(#bg-light-centre)" />
      </>
    ),

    // Dark: Two atmospheric glow clouds — warm amber top-right, cold indigo bottom-left
    dark: (
      <>
        <defs>
          <radialGradient id="bg-dark-amber" cx="75%" cy="20%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="bg-dark-indigo" cx="20%" cy="80%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="bg-dark-mid" cx="50%" cy="50%" r="40%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#1e2d40" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e2d40" stopOpacity="0"   />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-dark-amber)"  />
        <rect width={w} height={h} fill="url(#bg-dark-indigo)" />
        <rect width={w} height={h} fill="url(#bg-dark-mid)"    />
      </>
    ),

    // Sepia: Old-paper vignette — edges darken, centre glows warm
    sepia: (
      <>
        <defs>
          <radialGradient id="bg-sepia-glow" cx="48%" cy="40%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#fffbea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fffbea" stopOpacity="0"   />
          </radialGradient>
          <radialGradient id="bg-sepia-vig" cx="50%" cy="50%" r="70.7%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#92400e" stopOpacity="0"    />
            <stop offset="75%"  stopColor="#92400e" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0.09" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-sepia-glow)" />
        <rect width={w} height={h} fill="url(#bg-sepia-vig)"  />
      </>
    ),

    // Forest: Four corner blooms + bright canopy-light centre
    forest: (
      <>
        <defs>
          <radialGradient id="bg-forest-centre" cx="50%" cy="35%" r="50%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ffffff"  stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff"  stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="bg-forest-tl" cx="0%" cy="0%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#86efac" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="bg-forest-br" cx="100%" cy="100%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0"    />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-forest-tl)"     />
        <rect width={w} height={h} fill="url(#bg-forest-br)"     />
        <rect width={w} height={h} fill="url(#bg-forest-centre)" />
      </>
    ),
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" width={w} height={h}>
      {/* Base fill */}
      <rect width={w} height={h} fill={t.canvas} />

      {/* Dot grid */}
      <defs>
        <pattern id={`dots-${themeKey}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r={t.dotR} fill={t.gridDot} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#dots-${themeKey})`} />

      {/* Theme-specific decorations (include their own <defs>) */}
      {decorations[themeKey]}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Engine
// ─────────────────────────────────────────────────────────────────────────────
function layoutTree(rootIds: string[], unions: Union[]): LayoutResult {
  const positions  = new Map<string, { x: number; y: number }>();
  const connectors: LayoutConnector[] = [];

  const personUnions = new Map<string, Union[]>();
  unions.forEach(u =>
    [u.partner1Id, u.partner2Id].filter(Boolean).forEach(pid => {
      if (!personUnions.has(pid!)) personUnions.set(pid!, []);
      personUnions.get(pid!)!.push(u);
    })
  );

  const spouseOf = (pid: string, visited: Set<string>): string | null => {
    for (const u of personUnions.get(pid) ?? []) {
      const sid = u.partner1Id === pid ? u.partner2Id : u.partner1Id;
      if (sid && !visited.has(sid)) return sid;
    }
    return null;
  };

  const childrenOf = (pid: string, spouseId: string | null, visited: Set<string>): string[] => {
    const seen = new Set<string>(); const out: string[] = [];
    for (const u of personUnions.get(pid) ?? []) {
      const partner = u.partner1Id === pid ? u.partner2Id : u.partner1Id;
      if (spouseId !== null && partner !== null && partner !== spouseId) continue;
      for (const cid of u.childrenIds)
        if (!seen.has(cid) && !visited.has(cid)) { seen.add(cid); out.push(cid); }
    }
    return out;
  };

  const visited = new Set<string>();

  function place(pid: string, xLeft: number, depth: number): number {
    if (visited.has(pid)) return 0;
    visited.add(pid);

    const rowY    = depth * (CARD_H + V_GAP);
    const spouseId = spouseOf(pid, visited);
    if (spouseId) visited.add(spouseId);

    const children    = childrenOf(pid, spouseId, visited);
    const childWidths: number[] = [];
    let   childCursor = xLeft;
    for (const cid of children) {
      const w = place(cid, childCursor, depth + 1);
      childWidths.push(w);
      childCursor += w + H_GAP;
    }

    const childSpan = children.length === 0
      ? 0
      : childWidths.reduce((a, b) => a + b, 0) + (children.length - 1) * H_GAP;

    const footprint   = spouseId ? COUPLE_W : CARD_W;
    const subtreeW    = Math.max(footprint, childSpan);
    const slotCX      = xLeft + subtreeW / 2;

    if (spouseId) {
      positions.set(pid,      { x: slotCX - COUPLE_W / 2 + CARD_W / 2, y: rowY });
      positions.set(spouseId, { x: slotCX + COUPLE_W / 2 - CARD_W / 2, y: rowY });
    } else {
      positions.set(pid, { x: slotCX, y: rowY });
    }

    if (children.length > 0) {
      connectors.push({
        id:            `${pid}-${spouseId ?? "solo"}-${depth}`,
        p1x:           positions.get(pid)!.x,
        p2x:           spouseId ? positions.get(spouseId)!.x : positions.get(pid)!.x,
        parentBottomY: rowY + CARD_H,
        childXs:       children.map(c => positions.get(c)!.x),
        childTopY:     (depth + 1) * (CARD_H + V_GAP),
      });
    }
    return subtreeW;
  }

  let cursor = 0;
  for (const rid of rootIds) cursor += place(rid, cursor, 0) + H_GAP * 4;

  const maxY = Math.max(0, ...Array.from(positions.values()).map(p => p.y));
  return {
    nodes: positions, connectors,
    totalWidth:  cursor,
    totalHeight: maxY + CARD_H + 60,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector SVG Layer
// ─────────────────────────────────────────────────────────────────────────────
function ConnectorLayer({ connectors, lineColor, spouseColor }: {
  connectors:  LayoutConnector[];
  lineColor:   string;
  spouseColor: string;
}) {
  return (
    <>
      {connectors.map(c => {
        const hasSpouse = c.p1x !== c.p2x;
        const p1RX   = c.p1x + CARD_W / 2;
        const p2LX   = c.p2x - CARD_W / 2;
        const unionX = hasSpouse ? (p1RX + p2LX) / 2 : c.p1x;
        const elbowY = c.parentBottomY + (c.childTopY - c.parentBottomY) / 2;
        return (
          <g key={c.id}>
            {hasSpouse && (
              <line x1={p1RX} y1={c.parentBottomY} x2={p2LX} y2={c.parentBottomY}
                stroke={spouseColor} strokeWidth={1.5} strokeDasharray="5 3"
                strokeLinecap="round" opacity={0.75} />
            )}
            {hasSpouse && (
              <circle cx={unionX} cy={c.parentBottomY} r={4}
                fill={spouseColor} stroke="white" strokeWidth={1.5} />
            )}
            <line x1={unionX} y1={c.parentBottomY} x2={unionX} y2={elbowY}
              stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" />
            {c.childXs.length > 1 && (
              <line x1={Math.min(...c.childXs)} y1={elbowY}
                    x2={Math.max(...c.childXs)} y2={elbowY}
                stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" />
            )}
            {c.childXs.map((cx, i) => (
              <line key={i} x1={cx} y1={elbowY} x2={cx} y2={c.childTopY}
                stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Person Node Card — replaces external TreeCard for full design control.
// ─────────────────────────────────────────────────────────────────────────────
interface PersonNodeProps {
  person:       Person;
  t:            Theme;
  accentHex:    string;
  isFocus:      boolean;
  isHit:        boolean;
  hasKids:      boolean;
  isCollapsed:  boolean;
  onFocus:      (id: string) => void;
  onDrop:       (srcId: string, tgtId: string) => void;
  onCollapse:   (id: string) => void;
}

function PersonNode({
  person, t, accentHex, isFocus, isHit,
  hasKids, isCollapsed, onFocus, onDrop, onCollapse,
}: PersonNodeProps) {
  const { setHoveredPersonId } = useTreeInteraction();
  const initials  = `${person.firstName[0]}${person.lastName?.[0] ?? ""}`.toUpperCase();
  const isDead    = !!person.deathDate || person.status?.toLowerCase().includes("deceas");
  const birthYr   = person.birthDate?.match(/\d{4}/)?.[0];
  const deathYr   = person.deathDate?.match(/\d{4}/)?.[0];
  const dateLabel = [birthYr && `b. ${birthYr}`, deathYr && `d. ${deathYr}`].filter(Boolean).join("  ·  ");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/personId", person.id);
    e.dataTransfer.effectAllowed = "link";
  };
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "link"; };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    const src = e.dataTransfer.getData("text/personId");
    if (src && src !== person.id) onDrop(src, person.id);
  };

  const shadow = isFocus
    ? `0 0 0 3px ${accentHex}40, 0 8px 20px ${accentHex}25`
    : isHit
      ? `0 0 0 2.5px ${accentHex}70`
      : "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)";

  const avatarBg = isDead ? "#94a3b8" : accentHex;

  return (
    <div className="relative" style={{ width: CARD_W }}>
      {/* ── Card ─────────────────────────────────────────────────── */}
      <button
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setHoveredPersonId(person.id)}
        onMouseLeave={() => setHoveredPersonId(null)}
        onClick={() => onFocus(person.id)}
        style={{ width: CARD_W, height: CARD_H, boxShadow: shadow }}
        className={cn(
          "relative flex items-center overflow-hidden text-left cursor-pointer",
          "rounded-2xl border transition-all duration-150",
          "hover:shadow-lg hover:-translate-y-[2px] active:translate-y-0 active:shadow-sm",
          t.cardBg, t.cardBorder,
        )}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 inset-y-0 w-[3px]"
          style={{ backgroundColor: accentHex, opacity: isDead ? 0.35 : 0.9 }}
        />

        {/* Content row */}
        <div className="flex items-center w-full pl-3.5 pr-3 gap-2.5">
          {/* Avatar circle */}
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-black text-white select-none"
            style={{ width: 36, height: 36, backgroundColor: avatarBg, opacity: isDead ? 0.65 : 1 }}
          >
            {initials}
          </div>

          {/* Name + dates */}
          <div className="flex-1 min-w-0">
            <p
              className={cn("text-[12.5px] font-semibold leading-snug truncate", t.text)}
              style={{ opacity: isDead ? 0.5 : 1 }}
            >
              {person.firstName}{person.lastName ? " " + person.lastName : ""}
            </p>
            {dateLabel && (
              <p className={cn("text-[10px] mt-[2px] leading-none tabular-nums font-medium", t.muted)}>
                {dateLabel}
              </p>
            )}
          </div>

          {/* Living / deceased dot */}
          <div
            className="flex-shrink-0 rounded-full"
            style={{
              width: 6, height: 6,
              backgroundColor: isDead ? "#94a3b8" : "#22c55e",
              boxShadow: isDead ? "none" : "0 0 0 2.5px rgba(34,197,94,0.2)",
            }}
          />
        </div>
      </button>

      {/* ── Collapse / expand toggle ──────────────────────────────── */}
      {hasKids && (
        <button
          onClick={(e) => { e.stopPropagation(); onCollapse(person.id); }}
          title={isCollapsed ? "Expand descendants" : "Collapse descendants"}
          style={isCollapsed ? { transform: "translateX(-50%) rotate(180deg)" } : {}}
          className={cn(
            "absolute -bottom-[11px] left-1/2 -translate-x-1/2 z-10",
            "w-[22px] h-[22px] rounded-full flex items-center justify-center",
            "border shadow-md transition-all duration-150 hover:scale-110 active:scale-90",
            isCollapsed ? t.chipOn : t.chipOff,
          )}
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small icon button
// ─────────────────────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, children, className = "" }: {
  onClick: () => void; title?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95", className)}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main tree canvas
// ─────────────────────────────────────────────────────────────────────────────
function TreeCanvas({ treeId }: FamilyTreeProps) {
  const router = useRouter();
  const { hoveredPersonId } = useTreeInteraction();
  const containerRef   = useRef<HTMLDivElement>(null);
  const exportRef      = useRef<HTMLDivElement>(null);
  // Set via onInit callback — gives direct access to zoomIn/Out/centerView
  const transformRef   = useRef<ReactZoomPanPinchRef | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [themeKey, setThemeKey]               = useState<ThemeKey>("light");
  const [showSandbox, setShowSandbox]         = useState(true);
  const [isFullScreen, setIsFullScreen]       = useState(false);
  const [focusId, setFocusId]                 = useState<string | null>(null);
  const [collapsedSet, setCollapsedSet]       = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchOpen, setSearchOpen]           = useState(false);
  const [drawerPersonId, setDrawerPersonId]   = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen]   = useState(false);
  const [isExporting, setIsExporting]         = useState(false);
  const [proposalSrc, setProposalSrc]         = useState<string | null>(null);
  const [proposalTgt, setProposalTgt]         = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const t = THEMES[themeKey];

  // ── data ──────────────────────────────────────────────────────────────────
  const { data: rawPeople, isLoading } = useQuery({
    queryKey: ["tree-visual", treeId],
    queryFn:  async () => (await api.get(`/trees/${treeId}/visual`)).data as Person[],
  });

  // ── fullscreen ─────────────────────────────────────────────────────────────
  const toggleFS = useCallback(() =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen().catch(console.error), []);

  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── centering fix ──────────────────────────────────────────────────────────
  // centerOnInit fires before the sidebar spring animation (~350 ms) completes,
  // causing the tree to center within the wrong viewport width.
  // Instead we call centerView() after a delay whenever sidebar or layout changes.
  const centerTree = useCallback(() => {
    transformRef.current?.centerView(INITIAL_SCALE, 0);
  }, []);

  useEffect(() => {
    // Re-center after sidebar animation settles (spring stiffness 340, damping 34 ≈ 350 ms)
    const t = setTimeout(centerTree, 380);
    return () => clearTimeout(t);
  }, [showSandbox, centerTree]);

  // ── graph processing ───────────────────────────────────────────────────────
  const { peopleMap, unions, rootIds, peopleInTree } = useMemo(() => {
    if (!rawPeople) return { peopleMap: new Map<string, Person>(), unions: [] as Union[], rootIds: [] as string[], peopleInTree: [] as Person[] };
    
    const hasAnyConnection = new Set<string>();
    rawPeople.forEach(p => {
      if (p.relationships.length > 0) {
        hasAnyConnection.add(p.id);
        p.relationships.forEach(r => hasAnyConnection.add(r.targetId));
      }
    });

    const inTree = rawPeople.filter(p => hasAnyConnection.has(p.id));
    const pMap = new Map<string, Person>();
    inTree.forEach(p => pMap.set(p.id, p));

    const unionMap  = new Map<string, Union>();
    const hasParent = new Set<string>();

    inTree.forEach(person => {
      const parents = person.relationships.filter(r => r.type === "parent").map(r => r.targetId).sort();
      if (parents.length) {
        hasParent.add(person.id);
        const key = parents.join("–");
        if (!unionMap.has(key))
          unionMap.set(key, { id: key, partner1Id: parents[0], partner2Id: parents[1] ?? null, childrenIds: [] });
        unionMap.get(key)!.childrenIds.push(person.id);
      }
    });
    inTree.forEach(person =>
      person.relationships.filter(r => r.type === "spouse").forEach(rel => {
        const sorted = [person.id, rel.targetId].sort();
        const key    = sorted.join("–");
        if (!unionMap.has(key))
          unionMap.set(key, { id: key, partner1Id: sorted[0], partner2Id: sorted[1], childrenIds: [] });
      })
    );

    return {
      peopleMap: pMap,
      unions:    Array.from(unionMap.values()),
      rootIds:   inTree
        .filter(p => !hasParent.has(p.id))
        .map(p => p.id),
      peopleInTree: inTree
    };
  }, [rawPeople]);

  const allPeopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    rawPeople?.forEach(p => map.set(p.id, p));
    return map;
  }, [rawPeople]);

  const layout = useMemo(
    () => (peopleInTree.length > 0 ? layoutTree(rootIds, unions) : null),
    [rootIds, unions, peopleInTree],
  );

  // ── search ─────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!peopleInTree || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return peopleInTree
      .filter(p => `${p.firstName} ${p.lastName ?? ""}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [peopleInTree, searchQuery]);

  const searchHitIds = useMemo(() => new Set(searchResults.map(p => p.id)), [searchResults]);

  const openSearch  = useCallback(() => { setSearchOpen(true);  setTimeout(() => searchInputRef.current?.focus(), 80); }, []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(""); }, []);

  // ── event handlers ─────────────────────────────────────────────────────────
  const handleCardClick  = useCallback((id: string) => { setFocusId(id); setDrawerPersonId(id); }, []);
  const handleDrop       = useCallback((src: string, tgt: string) => { 
    setProposalSrc(src); 
    setProposalTgt(tgt); 
  }, []);
  const toggleCollapse   = useCallback((id: string) =>
    setCollapsedSet(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  // ── export ─────────────────────────────────────────────────────────────────
  const doExport = useCallback(async (format: "png" | "pdf") => {
    if (!exportRef.current) return;
    setIsExporting(true); setExportMenuOpen(false);
    try {
      const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: t.canvas });
      if (format === "png") {
        const a = document.createElement("a"); a.download = "family-tree.png"; a.href = dataUrl; a.click();
      } else {
        const img = new Image();
        img.onload = () => {
          const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width, img.height] });
          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
          pdf.save("family-tree.pdf");
        };
        img.src = dataUrl;
      }
    } finally { setIsExporting(false); }
  }, [t.canvas]);

  // ── loading ─────────────────────────────────────────────────────────────────
  if (isLoading || !layout) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full gap-5" style={{ backgroundColor: "#f1f5f9" }}>
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-indigo-100 border-t-indigo-500 animate-spin" />
          <Heart className="absolute inset-0 m-auto w-4 h-4 text-indigo-400" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Building your tree…</p>
      </div>
    );
  }

  const canvasW = layout.totalWidth  + PADDING * 2;
  const canvasH = layout.totalHeight + PADDING * 2;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative flex w-full h-full overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: t.canvas }}>

      {/* ══════════════════════════════════════════════════════════════════
          OUTER OVERLAY — controls that span sidebar + canvas boundary
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Sidebar toggle */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <IconBtn onClick={() => setShowSandbox(s => !s)}
            title={showSandbox ? "Hide panel" : "Show panel"} className={t.iconBtn}>
            {showSandbox ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </IconBtn>
        </div>

        {/* Expandable search bar */}
        <div className="absolute top-4 left-16 pointer-events-auto">
          <motion.div
            animate={{ width: searchOpen ? 228 : 36 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("h-9 rounded-xl flex items-center overflow-hidden", t.panel)}
          >
            <button onClick={searchOpen ? closeSearch : openSearch}
              className={cn("min-w-[36px] h-full flex items-center justify-center flex-shrink-0", t.muted)}>
              <Search className="w-3.5 h-3.5" />
            </button>
            <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people…"
              className={cn("flex-1 bg-transparent outline-none text-xs font-medium", t.text)} />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className={cn("mr-2 flex-shrink-0", t.muted)}>
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>

          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }}
                className={cn("absolute top-11 left-0 w-56 rounded-xl overflow-hidden", t.panel)}>
                {searchResults.map((p, i) => (
                  <button key={p.id}
                    onClick={() => { handleCardClick(p.id); closeSearch(); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-black/5",
                      i && "border-t border-black/5")}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: t.accent }}>
                      {p.firstName[0]}{p.lastName?.[0] ?? ""}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold truncate leading-tight", t.text)}>
                        {p.firstName} {p.lastName}
                      </p>
                      {p.birthDate && <p className={cn("text-[10px]", t.muted)}>{p.birthDate}</p>}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSandbox && (
          <motion.div
            initial={{ x: -SIDEBAR_W }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_W }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="h-full flex-shrink-0 relative z-40"
            style={{ width: SIDEBAR_W }}
          >
            <TreeSandboxSidebar 
              treeId={treeId} 
              onAddNew={() => setShowCreateModal(true)} 
              onSelectPerson={handleCardClick}
              onDrop={handleDrop}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          CANVAS AREA  (flex-1)
          All canvas overlays are children here so left-1/2 centres
          within the canvas, not the full page including sidebar.
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* Canvas overlay */}
        <div className="absolute inset-0 left-8 pointer-events-none z-20">
          {/* Fullscreen — top-right */}
          <div className="absolute top-4 right-4 pointer-events-auto">
            <IconBtn onClick={toggleFS} title={isFullScreen ? "Exit fullscreen" : "Fullscreen"} className={t.iconBtn}>
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </IconBtn>
          </div>

          {/* Tree stats — bottom-left */}
          {peopleInTree && (
            <div className="absolute bottom-4 left-4 pointer-events-auto">
              <div className={cn("flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-medium", t.panel, t.muted)}>
                <Users className="w-3 h-3 flex-shrink-0" />
                {peopleInTree.length} people · {unions.length} connections
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              Bottom-centre floating toolbar
              Zoom buttons call transformRef.current directly —
              no need to be inside TransformWrapper context.
          ────────────────────────────────────────────────────────── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className={cn("flex items-center gap-0.5 px-2 h-11 rounded-2xl", t.toolbar)}>

              {/* Zoom out */}
              <button title="Zoom out" onClick={() => transformRef.current?.zoomOut(0.3)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Fit / re-centre */}
              <button title="Fit to screen" onClick={centerTree}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Zoom in */}
              <button title="Zoom in" onClick={() => transformRef.current?.zoomIn(0.3)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 mx-1 bg-current opacity-10" />

              {/* Theme chips */}
              {(Object.keys(THEMES) as ThemeKey[]).map(k => {
                const { Icon, name } = THEMES[k];
                return (
                  <button key={k} title={name} onClick={() => setThemeKey(k)}
                    className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95",
                      k === themeKey ? t.chipOn : t.chipOff)}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}

              <div className="w-px h-5 mx-1 bg-current opacity-10" />

              {/* Export */}
              <div className="relative">
                <button title="Export" onClick={() => setExportMenuOpen(o => !o)}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {exportMenuOpen && (
                    <motion.div initial={{ y: 6, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 6, opacity: 0, scale: 0.95 }} transition={{ duration: 0.13 }}
                      className={cn("absolute bottom-11 right-0 w-40 rounded-xl overflow-hidden", t.panel)}>
                      <button onClick={() => doExport("png")}
                        className={cn("w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium transition-colors hover:bg-black/5", t.text)}>
                        <ImageDown className="w-3.5 h-3.5 flex-shrink-0" /> Export PNG
                      </button>
                      <button onClick={() => doExport("pdf")}
                        className={cn("w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium transition-colors hover:bg-black/5 border-t border-black/5", t.text)}>
                        <FileDown className="w-3.5 h-3.5 flex-shrink-0" /> Export PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
        {/* end canvas overlay */}

        {/* ── Pan / Zoom wrapper ──────────────────────────────────── */}
        <TransformWrapper
          // No centerOnInit — centerView() is called via useEffect after sidebar
          // animation settles to always measure the correct canvas div width.
          onInit={(ref) => { transformRef.current = ref; }}
          initialScale={INITIAL_SCALE}
          minScale={0.06}
          maxScale={4}
          limitToBounds={false}
          doubleClick={{ disabled: false, step: 0.5 }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>

            {/*
              exportRef wraps ALL rendering layers (background SVG, connector SVG,
              cards). toPng on this element captures the complete tree in one pass.
            */}
            <div ref={exportRef} style={{ position: "relative", width: canvasW, height: canvasH }}>

              {/* Layer 1 — Rich themed background (dots + decorative gradients) */}
              <ThemeBackground themeKey={themeKey} t={t} w={canvasW} h={canvasH} />

              {/* Layer 2 — Connector lines (SVG, same coordinate system as cards) */}
              {layout && (
                <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
                  <g transform={`translate(${PADDING},${PADDING})`}>
                    <ConnectorLayer connectors={layout.connectors} lineColor={t.line} spouseColor={t.spouseLine} />
                  </g>
                </svg>
              )}

              {/* Layer 3 — Person cards
                  left/top = PADDING aligns card coordinate origin with
                  the SVG <g transform="translate(PADDING,PADDING)"> above.
              */}
              <div className="absolute" style={{ left: PADDING, top: PADDING }}>
                {layout && Array.from(layout.nodes.entries()).map(([pid, pos]) => {
                  const person = peopleMap.get(pid);
                  if (!person) return null;
                  const hasKids = unions.some(u =>
                    (u.partner1Id === pid || u.partner2Id === pid) && u.childrenIds.length > 0
                  );
                  return (
                    <motion.div
                      key={pid}
                      initial={{ opacity: 0, scale: 0.88, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="absolute"
                      style={{ left: pos.x - CARD_W / 2, top: pos.y }}
                    >
                      <PersonNode
                        person={person}
                        t={t}
                        accentHex={t.accent}
                        isFocus={focusId === pid}
                        isHit={searchHitIds.has(pid)}
                        hasKids={hasKids}
                        isCollapsed={collapsedSet.has(pid)}
                        onFocus={handleCardClick}
                        onDrop={handleDrop}
                        onCollapse={toggleCollapse}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Empty tree state message */}
              {peopleInTree.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn("px-12 py-10 rounded-[2.5rem] border text-center shadow-xl max-w-md mx-auto", t.panel)}>
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6", THEMES.light.chipOn)}>
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className={cn("text-xl font-black mb-3", t.text)}>Your Tree is Empty</h3>
                    <p className={cn("text-sm font-medium mb-8 leading-relaxed", t.muted)}>
                      Start by adding your first relative from the sandbox or using the button below.
                    </p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className={cn("px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95", THEMES.light.chipOn)}
                    >
                      Add First Member
                    </button>
                  </div>
                </div>
              )}

            </div>
            {/* end exportRef */}

          </TransformComponent>
        </TransformWrapper>

      </div>
      {/* end canvas area */}

      {/* ══════════════════════════════════════════════════════════════════
          PROFILE DRAWER + PROPOSAL MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <ProfileDrawer
        person={drawerPersonId ? (allPeopleMap.get(drawerPersonId) ?? null) : null}
        peopleMap={allPeopleMap}
        isOpen={Boolean(drawerPersonId)}
        onClose={() => setDrawerPersonId(null)}
        onEdit={() => { if (drawerPersonId) router.push(`/person/${drawerPersonId}`); }}
        onProposeRelationship={() => { if (drawerPersonId) { setProposalSrc(drawerPersonId); setProposalTgt(""); } }}
        treeId={treeId}
      />

      <AnimatePresence>
        {proposalSrc && proposalTgt !== null && (
          <RelationshipProposalModal
            sourceId={proposalSrc}
            targetId={proposalTgt}
            treeId={treeId}
            onClose={() => { setProposalSrc(null); setProposalTgt(null); }}
          />
        )}
        {showCreateModal && (
          <CreatePersonModal
            treeId={treeId}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FamilyTreeContainer({ treeId }: FamilyTreeProps) {
  return <TreeCanvas treeId={treeId} />;
}