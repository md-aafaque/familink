"use client";

// ─── layout math via d3-hierarchy; all UI stays in React/Tailwind ────────────
import { hierarchy as d3Hierarchy, tree as d3Tree, HierarchyNode } from "d3-hierarchy";
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
  generation?: number | null;
}

interface Union {
  id: string;
  partner1Id: string;
  partner2Id: string | null;
  childrenIds: string[];
}

interface GenUnit {
  uid:           string;        // Unique tree node ID
  personId:      string;        // Primary person ID
  unions:        Array<{ partnerId: string | null, children: GenUnit[] }>;
  isVirtual?:    boolean;       
  generation?:   number;        // Persisted or calculated generation
}

interface LayoutConnector {
  id: string;
  p1x: number;        
  p2x: number;        
  parentBottomY: number;
  childXs: number[];  
  childTopY: number;
  isSpouseLink?: boolean;
}

interface LayoutResult {
  nodes:       Map<string, { x: number; y: number }>;
  connectors:  LayoutConnector[];
  totalWidth:  number;
  totalHeight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Constants
// ─────────────────────────────────────────────────────────────────────────────
const CARD_W       = 220; 
const CARD_H       = 80;  
const H_GAP        = 96;  
const V_GAP        = 140; 
const SPOUSE_GAP   = 56;  
const PADDING      = 300; 
const SIDEBAR_W    = 320;
const INITIAL_SCALE = 0.6;

const UNIT_W = CARD_W + H_GAP;

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    name: "Light", Icon: Grid3X3,
    canvas: "#f1f5f9", gridDot: "#c8d5e3", dotR: 0.85,
    line: "#94a3b8", spouseLine: "#f59e0b", accent: "#f59e0b",
    panel:   "bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm",
    toolbar: "bg-white/85 backdrop-blur-xl border border-slate-200/70 shadow-lg shadow-slate-200/50",
    text: "text-slate-800", muted: "text-slate-400",
    chipOn:  "bg-amber-600 text-white",
    chipOff: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    iconBtn: "bg-white/80 backdrop-blur-xl border border-slate-200/70 shadow-sm text-slate-500 hover:text-slate-800",
    cardBg: "bg-white", cardBorder: "border-slate-200/90",
  },
  dark: {
    name: "Dark", Icon: Moon,
    canvas: "#0d1117", gridDot: "#1a2233", dotR: 0.75,
    line: "#263045", spouseLine: "#3b82f6", accent: "#3b82f6",
    panel:   "bg-[#161d2e]/90 backdrop-blur-xl border border-slate-700/50 shadow-md shadow-black/30",
    toolbar: "bg-[#161d2e]/95 backdrop-blur-xl border border-slate-700/40 shadow-xl shadow-black/50",
    text: "text-slate-100", muted: "text-slate-500",
    chipOn:  "bg-blue-600 text-slate-100",
    chipOff: "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
    iconBtn: "bg-[#161d2e]/90 backdrop-blur-xl border border-slate-700/50 shadow-sm text-slate-400 hover:text-slate-100",
    cardBg: "bg-[#161d2e]", cardBorder: "border-slate-700/60",
  },
  sepia: {
    name: "Sepia", Icon: ScrollText,
    canvas: "#f8f2e3", gridDot: "#d9c9a3", dotR: 0.9,
    line: "#b09070", spouseLine: "#c17a3a", accent: "#9a6b2e",
    panel:   "bg-[#fdfaf0]/90 backdrop-blur-xl border border-amber-200/60 shadow-sm shadow-amber-100/30",
    toolbar: "bg-[#fdfaf0]/95 backdrop-blur-xl border border-amber-300/50 shadow-lg shadow-amber-100/40",
    text: "text-stone-800", muted: "text-stone-400",
    chipOn:  "bg-amber-700 text-white",
    chipOff: "text-amber-700 hover:bg-amber-100 hover:text-amber-900",
    iconBtn: "bg-[#fdfaf0]/90 backdrop-blur-xl border border-amber-200/60 shadow-sm text-stone-400 hover:text-stone-800",
    cardBg: "bg-[#fdfaf0]", cardBorder: "border-amber-200/70",
  },
  forest: {
    name: "Forest", Icon: Leaf,
    canvas: "#ecf5ec", gridDot: "#b0ccb0", dotR: 0.85,
    line: "#68966a", spouseLine: "#34d399", accent: "#16a34a",
    panel:   "bg-white/85 backdrop-blur-xl border border-emerald-200/60 shadow-sm shadow-emerald-100/30",
    toolbar: "bg-white/90 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-100/40",
    text: "text-emerald-950", muted: "text-emerald-600",
    chipOn:  "bg-emerald-600 text-white",
    chipOff: "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800",
    iconBtn: "bg-white/85 backdrop-blur-xl border border-emerald-200/60 shadow-sm text-emerald-400 hover:text-emerald-800",
    cardBg: "bg-white", cardBorder: "border-emerald-200/70",
  },
} as const;

type ThemeKey = keyof typeof THEMES;
type Theme    = (typeof THEMES)[ThemeKey];

// ─────────────────────────────────────────────────────────────────────────────
// Theme Background SVG
// ─────────────────────────────────────────────────────────────────────────────
function ThemeBackground({ themeKey, t, w, h }: { themeKey: ThemeKey; t: Theme; w: number; h: number }) {
  const decorations: Record<ThemeKey, React.ReactNode> = {
    light: (
      <>
        <defs>
          <radialGradient id="bg-light-top" cx="50%" cy="0%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-light-centre" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-light-top)" />
        <rect width={w} height={h} fill="url(#bg-light-centre)" />
      </>
    ),
    dark: (
      <>
        <defs>
          <radialGradient id="bg-dark-amber" cx="75%" cy="20%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-dark-indigo" cx="20%" cy="80%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-dark-amber)" />
        <rect width={w} height={h} fill="url(#bg-dark-indigo)" />
      </>
    ),
    sepia: (
      <>
        <defs>
          <radialGradient id="bg-sepia-glow" cx="48%" cy="40%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#fffbea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fffbea" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-sepia-vig" cx="50%" cy="50%" r="70.7%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#92400e" stopOpacity="0" />
            <stop offset="75%" stopColor="#92400e" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0.09" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-sepia-glow)" />
        <rect width={w} height={h} fill="url(#bg-sepia-vig)" />
      </>
    ),
    forest: (
      <>
        <defs>
          <radialGradient id="bg-forest-centre" cx="50%" cy="35%" r="50%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-forest-tl" cx="0%" cy="0%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-forest-br" cx="100%" cy="100%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#bg-forest-tl)" />
        <rect width={w} height={h} fill="url(#bg-forest-br)" />
        <rect width={w} height={h} fill="url(#bg-forest-centre)" />
      </>
    ),
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" width={w} height={h}>
      <rect width={w} height={h} fill={t.canvas} />
      <defs>
        <pattern id={`dots-${themeKey}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r={t.dotR} fill={t.gridDot} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#dots-${themeKey})`} />
      {decorations[themeKey]}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// D3 Layout Engine
// ─────────────────────────────────────────────────────────────────────────────

// ── Step 1: build the virtual GenUnit tree from flat data ─────────────────────
function buildGenTree(people: Person[], unions: Union[], collapsedSet: Set<string>): GenUnit {
  const pMap = new Map<string, Person>();
  people.forEach(p => pMap.set(p.id, p));

  const personUnions = new Map<string, Union[]>();
  unions.forEach(u => {
    [u.partner1Id, u.partner2Id].filter(Boolean).forEach(pid => {
      if (!personUnions.has(pid!)) personUnions.set(pid!, []);
      personUnions.get(pid!)!.push(u);
    });
  });

  const visited = new Set<string>();

  function buildUnit(pid: string): GenUnit {
    visited.add(pid);
    const person = pMap.get(pid);
    
    if (!person || collapsedSet.has(pid)) {
      return { uid: pid, personId: pid, unions: [], generation: person?.generation ?? 0 };
    }

    const myUnions = personUnions.get(pid) ?? [];
    const genUnions: GenUnit['unions'] = [];

    myUnions.forEach(u => {
      const partnerId = u.partner1Id === pid ? u.partner2Id : u.partner1Id;
      
      // We only "descend" into a union if we haven't visited the partner yet 
      // OR if there is no partner (single parent).
      if (!partnerId || !visited.has(partnerId)) {
        if (partnerId) visited.add(partnerId);
        
        genUnions.push({
          partnerId: partnerId,
          children: u.childrenIds
            .filter(cid => !visited.has(cid))
            .map(cid => buildUnit(cid))
        });
      }
    });

    return {
      uid: pid,
      personId: pid,
      unions: genUnions,
      generation: person.generation ?? 0
    };
  }

  // Identify roots: people with no parents IN THE DATA
  const hasParent = new Set<string>();
  unions.forEach(u => u.childrenIds.forEach(cid => hasParent.add(cid)));
  const roots = people.filter(p => !hasParent.has(p.id));

  const rootUnits: GenUnit[] = [];
  roots.forEach(r => {
    if (!visited.has(r.id)) {
      rootUnits.push(buildUnit(r.id));
    }
  });

  // Final fallback: catch anyone missed (e.g. islands or cycles)
  people.forEach(p => {
    if (!visited.has(p.id)) {
      rootUnits.push(buildUnit(p.id));
    }
  });

  return {
    uid: "__root__",
    personId: "__root__",
    unions: [{ partnerId: null, children: rootUnits }],
    isVirtual: true
  };
}

// ── Step 2: apply d3.tree() and emit LayoutResult ─────────────────────────────
function applyD3Layout(genTree: GenUnit): LayoutResult {
  const root = d3Hierarchy<GenUnit>(
    genTree,
    (d: GenUnit) => {
      const allChildren: GenUnit[] = [];
      d.unions.forEach(u => allChildren.push(...u.children));
      return allChildren.length > 0 ? allChildren : null;
    }
  );

  const getUnitWidth = (node: HierarchyNode<GenUnit>) => {
    if (node.data.isVirtual) return 40;
    const spouseCount = node.data.unions.filter(u => u.partnerId).length;
    return CARD_W + spouseCount * (CARD_W + SPOUSE_GAP);
  };

  d3Tree<GenUnit>()
    .nodeSize([UNIT_W, CARD_H + V_GAP])
    .separation((a, b) => {
      const wA = getUnitWidth(a);
      const wB = getUnitWidth(b);
      const gap = a.parent === b.parent ? H_GAP : H_GAP * 3;
      return (wA / 2 + wB / 2 + gap) / UNIT_W;
    })(root);

  const positions = new Map<string, { x: number; y: number }>();
  const connectors: LayoutConnector[] = [];

  // Find minX for normalization
  let minX = Infinity;
  root.each(node => {
    if (node.data.isVirtual) return;
    const w = getUnitWidth(node);
    const lx = node.x! - w / 2;
    if (lx < minX) minX = lx;
  });
  const xShift = isFinite(minX) ? -minX : 0;

  root.each((node: HierarchyNode<GenUnit>) => {
    if (node.data.uid === "__root__") return;
    
    // STRICT GENERATIONAL ALIGNMENT
    // Priority: Persisted generation from database -> calculated depth from D3
    const generation = node.data.generation ?? (node.depth - 1);
    const visualY = generation * (CARD_H + V_GAP);
    const shiftedX = node.x! + xShift;

    if (node.data.isVirtual) {
      if (node.children) {
        connectors.push({
          id: node.data.uid,
          p1x: shiftedX, p2x: shiftedX,
          parentBottomY: visualY,
          childXs: node.children.map(c => c.x! + xShift),
          childTopY: visualY + V_GAP / 2
        });
      }
      return;
    }

    const { personId, unions } = node.data;
    positions.set(personId, { x: shiftedX, y: visualY });

    // Symmetrical Spouse Distribution: [S2] [S4] [PRIMARY] [S1] [S3]
    let leftCount = 0;
    let rightCount = 0;

    unions.forEach((u, uIdx) => {
      const partnerId = u.partnerId;
      
      if (!partnerId) {
        // Solo parent descent
        if (u.children.length > 0) {
          connectors.push({
            id: `desc-solo-${personId}-${uIdx}`,
            p1x: shiftedX, p2x: shiftedX,
            parentBottomY: visualY + CARD_H,
            childXs: u.children.map(c => {
              const childNode = node.children?.find(cn => cn.data === c);
              return (childNode?.x ?? 0) + xShift;
            }),
            childTopY: (generation + 1) * (CARD_H + V_GAP)
          });
        }
        return;
      }

      const isRight = uIdx % 2 === 0;
      const offsetCount = isRight ? ++rightCount : ++leftCount;
      const spouseX = shiftedX + (isRight ? 1 : -1) * offsetCount * (CARD_W + SPOUSE_GAP);
      
      positions.set(partnerId, { x: spouseX, y: visualY });

      // Spouse connector (horizontal dashed)
      connectors.push({
        id: `sp-${personId}-${partnerId}`,
        p1x: shiftedX, p2x: spouseX,
        parentBottomY: visualY + CARD_H / 2,
        childXs: [],
        childTopY: visualY + CARD_H / 2,
        isSpouseLink: true
      });

      // Descendant connector from UNION midpoint
      if (u.children.length > 0) {
        const unionX = (shiftedX + spouseX) / 2;
        connectors.push({
          id: `desc-${personId}-${partnerId}`,
          p1x: unionX, p2x: unionX,
          parentBottomY: visualY + CARD_H / 2, 
          childXs: u.children.map(c => {
            const childNode = node.children?.find(cn => cn.data === c);
            return (childNode?.x ?? 0) + xShift;
          }),
          childTopY: (generation + 1) * (CARD_H + V_GAP)
        });
      }
    });
  });

  const allPos = Array.from(positions.values());
  const totalWidth  = allPos.length ? Math.max(...allPos.map(p => p.x)) + CARD_W / 2 : 0;
  const totalHeight = allPos.length ? Math.max(...allPos.map(p => p.y)) + CARD_H + 100 : 0;

  return { nodes: positions, connectors, totalWidth, totalHeight };
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
        if (c.isSpouseLink) {
          const p1X = c.p1x < c.p2x ? c.p1x + CARD_W / 2 : c.p1x - CARD_W / 2;
          const p2X = c.p1x < c.p2x ? c.p2x - CARD_W / 2 : c.p2x + CARD_W / 2;
          return (
            <line key={c.id} x1={p1X} y1={c.parentBottomY} x2={p2X} y2={c.parentBottomY}
              stroke={spouseColor} strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" opacity={0.6} />
          );
        }

        const elbowY = c.parentBottomY + (c.childTopY - c.parentBottomY) * 0.5;

        return (
          <g key={c.id}>
            {/* Junction dot */}
            <circle cx={c.p1x} cy={c.parentBottomY} r={4.5} fill={lineColor} stroke="white" strokeWidth={2} />
            
            {/* Vertical stem */}
            <line x1={c.p1x} y1={c.parentBottomY} x2={c.p1x} y2={elbowY} stroke={lineColor} strokeWidth={2} strokeLinecap="round" />

            {/* Horizontal bus */}
            {c.childXs.length > 1 && (
              <line x1={Math.min(...c.childXs)} y1={elbowY} x2={Math.max(...c.childXs)} y2={elbowY} stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
            )}

            {/* Vertical drops */}
            {c.childXs.map((cx, i) => (
              <line key={i} x1={cx} y1={elbowY} x2={cx} y2={c.childTopY} stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Person Node Card
// ─────────────────────────────────────────────────────────────────────────────
interface PersonNodeProps {
  person:      Person;
  t:           Theme;
  accentHex:   string;
  isFocus:     boolean;
  isHit:       boolean;
  hasKids:     boolean;
  isCollapsed: boolean;
  onFocus:     (id: string) => void;
  onDrop:      (srcId: string, tgtId: string) => void;
  onCollapse:  (id: string) => void;
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
  const dateLabel = [birthYr && birthYr, deathYr && deathYr].filter(Boolean).join(" — ");

  const onDragStart  = (e: React.DragEvent) => { e.dataTransfer.setData("text/personId", person.id); e.dataTransfer.effectAllowed = "link"; };
  const onDragOver   = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "link"; };
  const onDropHandle = (e: React.DragEvent) => { e.preventDefault(); const src = e.dataTransfer.getData("text/personId"); if (src && src !== person.id) onDrop(src, person.id); };

  const shadow = isFocus
    ? `0 0 0 4px ${accentHex}30, 0 12px 30px ${accentHex}20`
    : isHit
      ? `0 0 0 3px ${accentHex}60`
      : "0 4px 12px rgba(0,0,0,0.03), 0 1px 4px rgba(0,0,0,0.02)";

  return (
    <div className="relative group" style={{ width: CARD_W }}>
      <button
        draggable
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDropHandle}
        onMouseEnter={() => setHoveredPersonId(person.id)}
        onMouseLeave={() => setHoveredPersonId(null)}
        onClick={() => onFocus(person.id)}
        style={{ width: CARD_W, height: CARD_H, boxShadow: shadow }}
        className={cn(
          "relative flex items-center overflow-hidden text-left cursor-pointer",
          "rounded-[1.5rem] border transition-all duration-300",
          "hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-md",
          t.cardBg, t.cardBorder,
          isFocus && "ring-2 ring-primary/20",
        )}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(${accentHex} 1px, transparent 1px)`, backgroundSize: "12px 12px" }} />
        <div className="absolute left-0 inset-y-0 w-1.5"
          style={{ backgroundColor: accentHex, opacity: isDead ? 0.3 : 1 }} />
        <div className="flex items-center w-full pl-5 pr-4 gap-4 z-10">
          <div className="relative flex-shrink-0">
            <div className={cn(
              "rounded-2xl flex items-center justify-center text-[13px] font-black text-white shadow-sm transition-transform duration-500 group-hover:scale-105",
              isDead ? "bg-slate-400/80" : ""
            )}
            style={{ 
              width: 48, height: 48, 
              backgroundColor: isDead ? undefined : accentHex,
              boxShadow: isDead ? "none" : `0 4px 10px ${accentHex}40`
            }}>
              {initials}
            </div>
            {!isDead && person.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
            )}
          </div>
          <div className="flex-1 min-w-0 py-1">
            <h4 className={cn("text-[14px] font-black tracking-tight leading-none truncate mb-1.5", t.text)}
              style={{ opacity: isDead ? 0.6 : 1 }}>
              {person.firstName}
            </h4>
            <p className={cn("text-[12px] font-bold tracking-tight truncate mb-1", t.text)}
              style={{ opacity: isDead ? 0.4 : 0.7 }}>
              {person.lastName || ""}
            </p>
            {dateLabel && (
              <p className={cn("text-[10px] tabular-nums font-black tracking-widest uppercase opacity-40", t.muted)}>
                {dateLabel}
              </p>
            )}
          </div>
          {isDead && (
            <div className="flex-shrink-0 opacity-20">
              <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
            </div>
          )}
        </div>
      </button>
      {hasKids && (
        <button
          onClick={e => { e.stopPropagation(); onCollapse(person.id); }}
          title={isCollapsed ? "Expand Branch" : "Collapse Branch"}
          className={cn(
            "absolute -bottom-[14px] left-1/2 -translate-x-1/2 z-20",
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
            "border-2 shadow-lg hover:scale-110 active:scale-90",
            isCollapsed 
              ? "bg-primary text-white border-primary rotate-180" 
              : cn(t.cardBg, t.cardBorder, "text-slate-400 hover:text-primary")
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Button
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
// Tree Canvas
// ─────────────────────────────────────────────────────────────────────────────
function TreeCanvas({ treeId }: FamilyTreeProps) {
  const router         = useRouter();
  const containerRef   = useRef<HTMLDivElement>(null);
  const canvasDivRef   = useRef<HTMLDivElement>(null); 
  const exportRef      = useRef<HTMLDivElement>(null);
  const transformRef   = useRef<ReactZoomPanPinchRef | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const centeredRef    = useRef(false);

  const [themeKey, setThemeKey]             = useState<ThemeKey>("light");
  const [showSandbox, setShowSandbox]       = useState(true);
  const [isFullScreen, setIsFullScreen]     = useState(false);
  const [focusId, setFocusId]               = useState<string | null>(null);
  const [collapsedSet, setCollapsedSet]     = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [drawerPersonId, setDrawerPersonId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting]       = useState(false);
  const [proposalSrc, setProposalSrc]       = useState<string | null>(null);
  const [proposalTgt, setProposalTgt]       = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const t = THEMES[themeKey];

  const { data: rawPeople, isLoading } = useQuery({
    queryKey: ["tree-visual", treeId],
    queryFn:  async () => (await api.get(`/trees/${treeId}/visual`)).data as Person[],
  });

  const toggleFS = useCallback(() =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen().catch(console.error), []);

  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const { peopleMap, unions, peopleInTree } = useMemo(() => {
    if (!rawPeople) return {
      peopleMap: new Map<string, Person>(), unions: [] as Union[],
      peopleInTree: [] as Person[],
    };

    const inTree = rawPeople;
    const pMap     = new Map<string, Person>();
    const unionMap = new Map<string, Union>();

    inTree.forEach(p => pMap.set(p.id, p));

    inTree.forEach(person => {
      const parents = person.relationships
        .filter(r => r.type === "parent").map(r => r.targetId).sort();
      if (parents.length) {
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
      peopleMap:    pMap,
      unions:       Array.from(unionMap.values()),
      peopleInTree: inTree,
    };
  }, [rawPeople]);

  const allPeopleMap = useMemo(() => {
    const m = new Map<string, Person>();
    rawPeople?.forEach(p => m.set(p.id, p));
    return m;
  }, [rawPeople]);

  const layout = useMemo(() => {
    if (peopleInTree.length === 0) return null;
    const genTree = buildGenTree(peopleInTree, unions, collapsedSet);
    return applyD3Layout(genTree);
  }, [unions, peopleInTree, collapsedSet]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return peopleInTree.filter(p =>
      `${p.firstName} ${p.lastName ?? ""}`.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [peopleInTree, searchQuery]);

  const searchHitIds = useMemo(() => new Set(searchResults.map(p => p.id)), [searchResults]);
  const openSearch  = useCallback(() => { setSearchOpen(true);  setTimeout(() => searchInputRef.current?.focus(), 80); }, []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(""); }, []);

  const centerTree = useCallback(() => {
    if (!transformRef.current || !layout) return;
    const nodePositions = Array.from(layout.nodes.values());
    if (nodePositions.length === 0) return;

    const xs = nodePositions.map(p => p.x);
    const ys = nodePositions.map(p => p.y);
    const cMinX = Math.min(...xs) - CARD_W / 2 + PADDING;
    const cMaxX = Math.max(...xs) + CARD_W / 2 + PADDING;
    const cMinY = PADDING;
    const cMaxY = Math.max(...ys) + CARD_H + PADDING;

    const contentW  = cMaxX - cMinX;
    const contentH  = cMaxY - cMinY;
    const contentCX = (cMinX + cMaxX) / 2;
    const contentCY = (cMinY + cMaxY) / 2;

    const vpW = canvasDivRef.current?.clientWidth  ?? window.innerWidth - (showSandbox ? SIDEBAR_W : 0);
    const vpH = canvasDivRef.current?.clientHeight ?? window.innerHeight;

    const fitScale = Math.min(vpW * 0.88 / contentW, vpH * 0.85 / contentH, INITIAL_SCALE);

    transformRef.current.setTransform(
      vpW / 2 - contentCX * fitScale,
      vpH / 2 - contentCY * fitScale,
      fitScale,
      centeredRef.current ? 300 : 0,
    );
  }, [layout, showSandbox]);

  useEffect(() => {
    if (!layout) return;
    const delay = centeredRef.current ? 380 : 150;
    centeredRef.current = true;
    const timer = setTimeout(centerTree, delay);
    return () => clearTimeout(timer);
  }, [layout, showSandbox, centerTree]);

  const handleCardClick = useCallback((id: string) => { setFocusId(id); setDrawerPersonId(id); }, []);
  const handleDrop      = useCallback((src: string, tgt: string) => { setProposalSrc(src); setProposalTgt(tgt); }, []);
  const toggleCollapse  = useCallback((id: string) =>
    setCollapsedSet(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

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

  if (isLoading) return null;

  const canvasW = (layout?.totalWidth  ?? 0) + PADDING * 2;
  const canvasH = (layout?.totalHeight ?? 0) + PADDING * 2;

  return (
    <div ref={containerRef}
      className="relative flex w-full h-full overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: t.canvas }}>

      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute top-4 left-4 pointer-events-auto">
          <IconBtn onClick={() => setShowSandbox(s => !s)}
            title={showSandbox ? "Hide panel" : "Show panel"} className={t.iconBtn}>
            {showSandbox ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </IconBtn>
        </div>

        <div className="absolute top-4 left-16 pointer-events-auto">
          <motion.div animate={{ width: searchOpen ? 228 : 36 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("h-9 rounded-xl flex items-center overflow-hidden", t.panel)}>
            <button onClick={searchOpen ? closeSearch : openSearch}
              className={cn("min-w-[36px] h-full flex items-center justify-center flex-shrink-0", t.muted)}>
              <Search className="w-3.5 h-3.5" />
            </button>
            <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people…" className={cn("flex-1 bg-transparent outline-none text-xs font-medium", t.text)} />
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
                  <button key={p.id} onClick={() => { handleCardClick(p.id); closeSearch(); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-black/5", i && "border-t border-black/5")}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: t.accent }}>
                      {p.firstName[0]}{p.lastName?.[0] ?? ""}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold truncate leading-tight", t.text)}>{p.firstName} {p.lastName}</p>
                      {p.birthDate && <p className={cn("text-[10px]", t.muted)}>{p.birthDate}</p>}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showSandbox && (
          <motion.div
            initial={{ x: -SIDEBAR_W }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_W }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="h-full flex-shrink-0 relative z-40" style={{ width: SIDEBAR_W }}>
                <TreeSandboxSidebar treeId={treeId}
              onAddNew={() => setShowCreateModal(true)}
              onSelectPerson={handleCardClick}
              onDrop={handleDrop} />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={canvasDivRef} className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-4 right-4 pointer-events-auto">
            <IconBtn onClick={toggleFS} title={isFullScreen ? "Exit fullscreen" : "Fullscreen"} className={t.iconBtn}>
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </IconBtn>
          </div>

          {peopleInTree.length > 0 && (
            <div className="absolute bottom-4 left-4 pointer-events-auto">
              <div className={cn("flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-medium", t.panel, t.muted)}>
                <Users className="w-3 h-3 flex-shrink-0" />
                {peopleInTree.length} people · {unions.length} connections
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className={cn("flex items-center gap-0.5 px-2 h-11 rounded-2xl", t.toolbar)}>
              <button title="Zoom out" onClick={() => transformRef.current?.zoomOut(0.3)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button title="Fit to screen" onClick={centerTree}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button title="Zoom in" onClick={() => transformRef.current?.zoomIn(0.3)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-5 mx-1 bg-current opacity-10" />
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

        <TransformWrapper
          onInit={ref => { transformRef.current = ref; }}
          initialScale={INITIAL_SCALE}
          minScale={0.06}
          maxScale={4}
          limitToBounds={false}
          doubleClick={{ disabled: false, step: 0.5 }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div ref={exportRef} style={{ position: "relative", width: canvasW, height: canvasH }}>
              <ThemeBackground themeKey={themeKey} t={t} w={canvasW} h={canvasH} />
              {layout && (
                <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
                  <g transform={`translate(${PADDING},${PADDING})`}>
                    <ConnectorLayer connectors={layout.connectors} lineColor={t.line} spouseColor={t.spouseLine} />
                  </g>
                </svg>
              )}
              <div className="absolute" style={{ left: PADDING, top: PADDING }}>
                {layout && Array.from(layout.nodes.entries()).map(([pid, pos]) => {
                  const person = peopleMap.get(pid);
                  if (!person) return null;
                  const hasKids = unions.some(u => (u.partner1Id === pid || u.partner2Id === pid) && u.childrenIds.length > 0);
                  return (
                    <motion.div key={pid}
                      initial={{ opacity: 0, scale: 0.88, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="absolute"
                      style={{ left: pos.x - CARD_W / 2, top: pos.y }}>
                      <PersonNode
                        person={person} t={t} accentHex={t.accent}
                        isFocus={focusId === pid} isHit={searchHitIds.has(pid)}
                        hasKids={hasKids} isCollapsed={collapsedSet.has(pid)}
                        onFocus={handleCardClick} onDrop={handleDrop} onCollapse={toggleCollapse}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {peopleInTree.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn("px-12 py-10 rounded-[2.5rem] border text-center shadow-xl max-w-md mx-auto", t.panel)}>
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6", THEMES.light.chipOn)}>
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className={cn("text-xl font-black mb-3", t.text)}>Build Your Family Tree</h3>
                    <p className={cn("text-sm font-medium mb-8 leading-relaxed", t.muted)}>
                      Add your first family member and connect them to start visualizing your history.
                    </p>
                    <button onClick={() => setShowCreateModal(true)}
                      className={cn("px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95", THEMES.light.chipOn)}>
                      Add First Member
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

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
          <RelationshipProposalModal sourceId={proposalSrc} targetId={proposalTgt} treeId={treeId}
            onClose={() => { setProposalSrc(null); setProposalTgt(null); }} />
        )}
        {showCreateModal && (
          <CreatePersonModal treeId={treeId} onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FamilyTreeContainer({ treeId }: FamilyTreeProps) {
  return <TreeCanvas treeId={treeId} />;
}