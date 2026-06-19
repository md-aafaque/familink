"use client";

import { hierarchy as d3Hierarchy, tree as d3Tree, HierarchyNode } from "d3-hierarchy";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import DragRelationshipIndicator from "./DragRelationshipIndicator";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";

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
  p1x: number;        // centre-x of primary person card
  p2x: number;        // centre-x of spouse card (= p1x when solo)
  parentBottomY: number;
  childXs: number[];  // centre-x of each child unit (couple-midpoint or solo-centre)
  childTopY: number;
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
const CARD_W       = 220; // Increased for better readability
const CARD_H       = 80;  // Increased for a more premium feel
const H_GAP        = 96;  // More breathing room
const V_GAP        = 140; // More vertical space for connectors
const SPOUSE_GAP   = 56;  
const COUPLE_W     = CARD_W + SPOUSE_GAP + CARD_W;
const PADDING      = 300; 
const SIDEBAR_W    = 320;
const SIDEBAR_COLLAPSED_W = 64;
const INITIAL_SCALE = 0.6;

// Unit width used as the d3 nodeSize base and the separation denominator.
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
    chipOn:  "bg-indigo-600 text-slate-100",
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

/**
 * A "generation unit" — the atom of the d3 tree.
 * Each unit is either a solo person OR a couple (primary + spouse).
 * Virtual root unifies multiple family trees under one d3 root node.
 *
 *   virtualRoot
 *   ├── GenUnit(mum, papa)            ← depth 1
 *   │   ├── GenUnit(aafaque, genius)  ← depth 2
 *   │   │   └── GenUnit(sonat, wifi)  ← depth 3
 *   │   │       └── GenUnit(granson)  ← depth 4
 *   │   └── GenUnit(krish, agarwal)   ← depth 2
 *   │       ├── GenUnit(krishjr)      ← depth 3
 *   │       └── GenUnit(dotka)        ← depth 3
 *   └── GenUnit(BA)                   ← depth 1  (isolated root)
 */
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface GenUnit {
  uid:           string;        // Person ID
  personId:      string;
  spouseIds:     string[];      // All spouses of this person
  children:      GenUnit[];
  isVirtual?:    boolean;       // For the root wrapper
  collapsed?:    boolean;       // Union was collapsed, children hidden
}

// ── Step 1: build the virtual GenUnit tree from flat data ─────────────────────
function buildGenTree(people: Person[], unions: Union[], collapsedUnions: Set<string>): GenUnit {
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
    if (!person) {
      return { uid: pid, personId: pid, spouseIds: [], children: [] };
    }

    // Find all spouses
    const spouses: string[] = [];
    const myUnions = personUnions.get(pid) ?? [];
    myUnions.forEach(u => {
      const sid = u.partner1Id === pid ? u.partner2Id : u.partner1Id;
      if (sid && !visited.has(sid)) {
        visited.add(sid);
        spouses.push(sid);
      }
    });

    // Find children from unions that are NOT collapsed
    const childrenIds = new Set<string>();
    myUnions.forEach(u => {
      if (collapsedUnions.has(u.id)) return;
      u.childrenIds.forEach(cid => {
        if (!visited.has(cid)) childrenIds.add(cid);
      });
    });

    const anyCollapsed = myUnions.some(u => collapsedUnions.has(u.id));

    return {
      uid: pid,
      personId: pid,
      spouseIds: spouses,
      children: Array.from(childrenIds).map(cid => buildUnit(cid)),
      collapsed: anyCollapsed || undefined,
    };
  }

  // Identify roots: people with no parents IN THE TREE
  const hasParent = new Set<string>();
  unions.forEach(u => u.childrenIds.forEach(cid => hasParent.add(cid)));

  // A person should NOT be a root if they are a spouse of someone who HAS parents
  // (because they should be pulled in as a spouse of that descendant instead).
  const isSpouseOfDescendant = new Set<string>();
  people.forEach(p => {
    if (hasParent.has(p.id)) {
      p.relationships.forEach(rel => {
        if (rel.type === 'spouse') isSpouseOfDescendant.add(rel.targetId);
      });
    }
  });

  const roots = people.filter(p => 
    !hasParent.has(p.id) && 
    !isSpouseOfDescendant.has(p.id) && 
    !visited.has(p.id)
  );

  // If multiple roots, we might have siblings. Try to group them.
  const rootUnits: GenUnit[] = [];
  
  // Advanced: group siblings who are roots
  const processedRoots = new Set<string>();
  roots.forEach(r => {
    if (processedRoots.has(r.id)) return;
    
    // Find all siblings of this root that are also roots
    const siblings = [r.id];
    r.relationships
      .filter(rel => rel.type === 'sibling' && !hasParent.has(rel.targetId))
      .forEach(rel => {
        if (!processedRoots.has(rel.targetId)) siblings.push(rel.targetId);
      });
    
    if (siblings.length > 1) {
      // Create a virtual unit to hold these siblings
      const clusterId = `cluster-${r.id}`;
      rootUnits.push({
        uid: clusterId,
        personId: clusterId,
        spouseIds: [],
        children: siblings.filter(id => !visited.has(id)).map(id => buildUnit(id)),
        isVirtual: true
      });
      siblings.forEach(s => processedRoots.add(s));
    } else {
      if (!visited.has(r.id)) {
        rootUnits.push(buildUnit(r.id));
        processedRoots.add(r.id);
      }
    }
  });

  return {
    uid: "__root__",
    personId: "__root__",
    spouseIds: [],
    children: rootUnits,
    isVirtual: true
  };
}

// ── Step 2: apply d3.tree() and emit LayoutResult ─────────────────────────────
function applyD3Layout(genTree: GenUnit): LayoutResult {
  const root = d3Hierarchy<GenUnit>(
    genTree,
    (d: GenUnit) => (d.children.length > 0 ? d.children : null),
  );

  // Layout sizing logic
  const getUnitWidth = (node: HierarchyNode<GenUnit>) => {
    if (node.data.isVirtual) return 40;
    const count = 1 + node.data.spouseIds.length;
    return count * CARD_W + (count - 1) * SPOUSE_GAP;
  };

  d3Tree<GenUnit>()
    .nodeSize([UNIT_W, CARD_H + V_GAP])
    .separation((a, b) => {
      const wA = getUnitWidth(a);
      const wB = getUnitWidth(b);
      const gap = a.parent === b.parent ? H_GAP : H_GAP * 2.5;
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
    
    // Normal generation mapping:
    // depth 1 = root cluster/unit
    // depth 2 = first descendants
    const visualY = (node.depth - 1) * (CARD_H + V_GAP);
    const shiftedX = node.x! + xShift;

    if (node.data.isVirtual) {
      // Draw a line from the virtual center to children
      if (node.children) {
        connectors.push({
          id: node.data.uid,
          p1x: shiftedX, p2x: shiftedX,
          parentBottomY: visualY,
          childXs: node.children.map(c => c.x! + xShift),
          childTopY: visualY + V_GAP / 2 // drop halfway to next generation
        });
      }
      return;
    }

    const { personId, spouseIds } = node.data;
    const unitW = getUnitWidth(node);
    let curX = shiftedX - unitW / 2 + CARD_W / 2;

    positions.set(personId, { x: curX, y: visualY });
    const pX = curX;

    spouseIds.forEach(sid => {
      curX += CARD_W + SPOUSE_GAP;
      positions.set(sid, { x: curX, y: visualY });
    });

    // Push connector when node has children or was collapsed (preserve spouse
    // line + vertical stem). Genuine leaf nodes get none.
    if (node.children || node.data.collapsed) {
      const lastSpouseX = curX;
      connectors.push({
        id: `rel-${personId}`,
        p1x: pX,
        p2x: lastSpouseX,
        parentBottomY: visualY + CARD_H,
        childXs: node.children ? node.children.map(c => c.x! + xShift) : [],
        childTopY: (node.depth) * (CARD_H + V_GAP)
      });
    }
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
        const hasSpouse = c.p1x !== c.p2x;
        const p1RX   = c.p1x + CARD_W / 2;
        const p2LX   = c.p2x - CARD_W / 2;
        const unionX = hasSpouse ? (p1RX + p2LX) / 2 : c.p1x;
        const elbowY = c.parentBottomY + (c.childTopY - c.parentBottomY) * 0.5;

        return (
          <g key={c.id}>
            {/* Horizontal spouse connection */}
            {hasSpouse && (
              <line x1={p1RX} y1={c.parentBottomY - CARD_H/2} x2={p2LX} y2={c.parentBottomY - CARD_H/2}
                stroke={spouseColor} strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" opacity={0.6} />
            )}
            
            {/* Junction dot */}
            <circle cx={unionX} cy={hasSpouse ? c.parentBottomY - CARD_H/2 : c.parentBottomY} r={4.5} 
              fill={hasSpouse ? spouseColor : lineColor} stroke="white" strokeWidth={2} />

            {/* Vertical stem — full length when children exist, short stub to icon otherwise */}
            <line x1={unionX}
              y1={hasSpouse ? c.parentBottomY - CARD_H/2 : c.parentBottomY}
              x2={unionX}
              y2={c.childXs.length > 0 ? elbowY : c.parentBottomY + 6}
              stroke={lineColor} strokeWidth={2} strokeLinecap="round" />

            {/* Horizontal bus */}
            {c.childXs.length > 1 && (
              <line x1={Math.min(...c.childXs)} y1={elbowY} x2={Math.max(...c.childXs)} y2={elbowY}
                stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
            )}

            {/* Vertical drops */}
            {c.childXs.map((cx, i) => (
              <line key={i} x1={cx} y1={elbowY} x2={cx} y2={c.childTopY}
                stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
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
  person:     Person;
  t:           Theme;
  accentHex:   string;
  isFocus:     boolean;
  isHit:       boolean;
  onFocus:     (id: string) => void;
  onDrop:      (srcId: string, tgtId: string) => void;
}

function PersonNode({
  person, t, accentHex, isFocus, isHit,
  onFocus, onDrop,
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
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(${accentHex} 1px, transparent 1px)`, backgroundSize: "12px 12px" }} />

        {/* Left accent bar */}
        <div className="absolute left-0 inset-y-0 w-1.5"
          style={{ backgroundColor: accentHex, opacity: isDead ? 0.3 : 1 }} />

        {/* Card Content */}
        <div className="flex items-center w-full pl-5 pr-4 gap-4 z-10">
          {/* Avatar Container */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "rounded-2xl flex items-center justify-center text-[13px] font-black text-white shadow-sm transition-transform duration-500 group-hover:scale-105 overflow-hidden",
              isDead ? "bg-slate-400/80" : ""
            )}
            style={{ 
              width: 48, height: 48, 
              backgroundColor: isDead ? undefined : accentHex,
              boxShadow: isDead ? "none" : `0 4px 10px ${accentHex}40`
            }}>
              {(person as any).imageUrl ? (
                <img src={(person as any).imageUrl} alt="" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            
            {/* Live/Status Indicator */}
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
          
          {/* Deceased Marker */}
          {isDead && (
            <div className="flex-shrink-0 opacity-20">
              <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
            </div>
          )}
        </div>
      </button>
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
  const canvasDivRef   = useRef<HTMLDivElement>(null); // flex-1 canvas area
  const exportRef      = useRef<HTMLDivElement>(null);
  const transformRef   = useRef<ReactZoomPanPinchRef | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Tracks whether the initial centering has fired (for delay logic)
  const centeredRef    = useRef(false);

  const { theme: appTheme } = useAppTheme();
  const { t: tLang } = useLanguage();
  const [themeKey, setThemeKey] = useState<ThemeKey>(appTheme.isDark ? "dark" : "light");

  useEffect(() => {
    setThemeKey(appTheme.isDark ? "dark" : "light");
  }, [appTheme.isDark]);
  const [showSandbox, setShowSandbox]       = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen]     = useState(false);
  const [focusId, setFocusId]               = useState<string | null>(null);
  const [collapsedUnions, setCollapsedUnions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [drawerPersonId, setDrawerPersonId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting]       = useState(false);
  const [proposalSrc, setProposalSrc]       = useState<string | null>(null);
  const [proposalTgt, setProposalTgt]       = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const t = THEMES[themeKey];

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: tree } = useQuery({
    queryKey: ["tree", treeId],
    queryFn: async () => (await api.get(`/trees/${treeId}`)).data as any,
  });

  const { data: rawPeople, isLoading } = useQuery({
    queryKey: ["tree-visual", treeId],
    queryFn:  async () => (await api.get(`/trees/${treeId}/visual`)).data as Person[],
  });

  const queryClient = useQueryClient();
  const userRole = tree?.role;

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const toggleFS = useCallback(() =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen().catch(console.error), []);

  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

    // ── Graph processing ───────────────────────────────────────────────────────
  const { peopleMap, unions, rootClusters, peopleInTree } = useMemo(() => {
    if (!rawPeople) return {
      peopleMap: new Map<string, Person>(), unions: [] as Union[],
      rootClusters: [] as string[][], peopleInTree: [] as Person[],
    };

    // Include people who have at least one relationship, 
    // OR if there is only 1 person in the tree (the creator).
    const connected = new Set<string>();
    rawPeople.forEach(p => {
      if (p.relationships.length > 0) {
        connected.add(p.id);
        p.relationships.forEach(r => connected.add(r.targetId));
      }
    });
    const inTree = rawPeople.filter(p => connected.has(p.id));

    // const inTree = (rawPeople.length === 1 || connected.size > 0) 
    //   ? rawPeople.filter(p => connected.has(p.id) || rawPeople.length === 1)
    //   : rawPeople.filter(p => connected.has(p.id));

    const pMap     = new Map<string, Person>();
    const unionMap = new Map<string, Union>();
    const hasParent = new Set<string>();

    inTree.forEach(p => pMap.set(p.id, p));

    inTree.forEach(person => {
      const parents = person.relationships
        .filter(r => r.type === "parent").map(r => r.targetId).sort();
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

    const rootIds = inTree.filter(p => !hasParent.has(p.id)).map(p => p.id);

    // ── Sibling Root Grouping ──
    const rootClusters: string[][] = [];
    const usedInCluster = new Set<string>();

    rootIds.forEach(rid => {
      if (usedInCluster.has(rid)) return;
      const cluster = [rid];
      usedInCluster.add(rid);

      const queue = [rid];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const person = pMap.get(currentId);
        person?.relationships
          .filter(r => r.type === "sibling" && rootIds.includes(r.targetId) && !usedInCluster.has(r.targetId))
          .forEach(r => {
            cluster.push(r.targetId);
            usedInCluster.add(r.targetId);
            queue.push(r.targetId);
          });
      }
      rootClusters.push(cluster);
    });

    return {
      peopleMap:    pMap,
      unions:       Array.from(unionMap.values()),
      rootClusters,
      peopleInTree: inTree,
    };
  }, [rawPeople]);

  const allPeopleMap = useMemo(() => {
    const m = new Map<string, Person>();
    rawPeople?.forEach(p => m.set(p.id, p));
    return m;
  }, [rawPeople]);

  // ── Layout (D3) ────────────────────────────────────────────────────────────
  const layout = useMemo(() => {
    if (peopleInTree.length === 0) return null;
    const genTree = buildGenTree(peopleInTree, unions, collapsedUnions);
    return applyD3Layout(genTree);
  }, [unions, peopleInTree, collapsedUnions]);

  // ── Search ─────────────────────────────────────────────────────────────────
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

  // ── Centering ──────────────────────────────────────────────────────────────
  /**
   * Uses the ACTUAL content bounding box (not full canvas dimensions) so that
   * isolated outlier nodes (like a solo "BA" root far to the right) don't push
   * the center into empty space.
   *
   * setTransform is used instead of centerView because centerView aims at the
   * exact centre of the canvas element, which includes the large PADDING zone
   * and the empty space to the right of outlier roots.
   */
  const centerTree = useCallback(() => {
    if (!transformRef.current || !layout) return;

    const nodePositions = Array.from(layout.nodes.values());
    if (nodePositions.length === 0) return;

    // Content bounding box in canvas coordinates (layout coords + PADDING offset)
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

    // Viewport = the flex-1 canvas div (not full window width)
    const currentSidebarW = showSandbox ? (isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W) : 0;
    const vpW = canvasDivRef.current?.clientWidth  ?? window.innerWidth - currentSidebarW;
    const vpH = canvasDivRef.current?.clientHeight ?? window.innerHeight;

    // Scale to fill ~88% of the viewport, capped at INITIAL_SCALE (don't zoom in)
    const fitScale = Math.min(
      vpW * 0.88 / contentW,
      vpH * 0.85 / contentH,
      INITIAL_SCALE,
    );

    // Translate so contentCX maps to vpW/2 and contentCY maps to vpH/2
    transformRef.current.setTransform(
      vpW / 2 - contentCX * fitScale,
      vpH / 2 - contentCY * fitScale,
      fitScale,
      centeredRef.current ? 300 : 0, // animate re-centers; snap on first load
    );
  }, [layout, showSandbox, isSidebarCollapsed]);

  useEffect(() => {
    if (!layout) return; // ← KEY FIX: don't attempt to center before data loads

    // First center: short delay lets the DOM paint before we measure
    // Subsequent centers (sidebar toggle): longer delay for spring animation
    const delay = centeredRef.current ? 380 : 150;
    centeredRef.current = true;
    const timer = setTimeout(centerTree, delay);
    return () => clearTimeout(timer);
  }, [layout, showSandbox, isSidebarCollapsed, centerTree]); // ← layout in deps fixes the "always top-left" bug

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((id: string) => { setFocusId(id); setDrawerPersonId(id); }, []);
  const handleDrop      = useCallback((src: string, tgt: string) => { setProposalSrc(src); setProposalTgt(tgt); }, []);
  const toggleCollapse  = useCallback((unionId: string) =>
    setCollapsedUnions(prev => { const n = new Set(prev); n.has(unionId) ? n.delete(unionId) : n.add(unionId); return n; }), []);

  const handleDeletePerson = useCallback(async (personId: string, reason?: string) => {
    try {
      if (userRole === 'admin') {
        // Direct deletion for admins
        await api.delete(`/trees/${treeId}/people/${personId}`);
      } else {
        // Proposal for others
        await api.post(`/trees/${treeId}/people/${personId}/propose-deletion`, { reason });
      }
      
      queryClient.invalidateQueries({ queryKey: ["tree-visual", treeId] });
      queryClient.invalidateQueries({ queryKey: ["tree-people-sandbox", treeId] });
      setDrawerPersonId(null);
    } catch (err) {
      console.error("Failed to process deletion:", err);
    }
  }, [treeId, queryClient, userRole]);

  // ── Export ─────────────────────────────────────────────────────────────────
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

  // ── Loading / empty state ─────────────────────────────────────────────────
  if (isLoading) {
    return null; // Parent page handles initial loading
  }

  const canvasW = (layout?.totalWidth  ?? 0) + PADDING * 2;
  const canvasH = (layout?.totalHeight ?? 0) + PADDING * 2;

  return (
    <div ref={containerRef}
      className="relative flex w-full h-full overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: t.canvas }}>

      {/* ══════════════════════════════════════════════════════════════════
          OUTER OVERLAY — sidebar toggle (straddles sidebar/canvas)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute top-4 left-4 pointer-events-auto">
          <IconBtn onClick={() => setShowSandbox(s => !s)}
            title={showSandbox ? tLang('treePage.hidePanel') : tLang('treePage.showPanel')} className={t.iconBtn}>
            {showSandbox ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </IconBtn>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSandbox && (
          <motion.div
            initial={{ x: -SIDEBAR_W }} 
            animate={{ 
              x: 0,
              width: isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W 
            }} 
            exit={{ x: -SIDEBAR_W }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="h-full flex-shrink-0 relative z-40 overflow-hidden"
          >
            <TreeSandboxSidebar 
              treeId={treeId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onAddNew={() => setShowCreateModal(true)}
              onSelectPerson={handleCardClick}
              onDrop={handleDrop} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          CANVAS  (flex-1)
          All overlays are children here → left-1/2 is canvas-relative,
          not page-relative. The canvasDivRef gives us accurate clientWidth
          for centering calculations.
      ══════════════════════════════════════════════════════════════════ */}
      <div ref={canvasDivRef} className="flex-1 relative overflow-hidden">

        {/* Canvas overlay — inset-0 (no left-8 offset) */}
        {peopleInTree.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20">

            {/* Search — top-left of canvas */}
            <div className="absolute top-4 left-4 pointer-events-auto">
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
                    className={cn("absolute top-11 left-0 w-56 rounded-xl overflow-hidden shadow-2xl", t.panel)}>
                    {searchResults.map((p, i) => (
                      <button key={p.id} onClick={() => { handleCardClick(p.id); closeSearch(); }}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5", 
                            i && "border-t",
                            themeKey === 'sepia' ? "border-stone-200/50" : (themeKey === 'forest' ? "border-emerald-100" : "border-slate-100/50")
                        )}>
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

            {/* Fullscreen — top-right of canvas */}
            <div className="absolute top-4 right-4 pointer-events-auto">
              <IconBtn onClick={toggleFS} title={isFullScreen ? tLang('treePage.exitFullscreen') : tLang('treePage.fullscreen')} className={t.iconBtn}>
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </IconBtn>
            </div>

            {/* Stats — bottom-left */}
            {peopleInTree.length > 0 && (
              <div className="absolute bottom-4 left-4 pointer-events-auto">
                <div className={cn("flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-medium", t.panel, t.muted)}>
                  <Users className="w-3 h-3 flex-shrink-0" />
                  {peopleInTree.length} people · {unions.length} connections
                </div>
              </div>
            )}

            {/* Bottom-centre floating toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div className={cn("flex items-center gap-0.5 px-2 h-11 rounded-2xl", t.toolbar)}>
                <button title={tLang('treePage.zoomOut')} onClick={() => transformRef.current?.zoomOut(0.3)}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button title={tLang('treePage.fitToScreen')} onClick={centerTree}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95", t.chipOff)}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button title={tLang('treePage.zoomIn')} onClick={() => transformRef.current?.zoomIn(0.3)}
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
                  <button title={tLang('treePage.export')} onClick={() => setExportMenuOpen(o => !o)}
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
        )}
        {/* end canvas overlay */}


        <TransformWrapper
          onInit={ref => { transformRef.current = ref; }}
          initialScale={INITIAL_SCALE}
          minScale={0.06}
          maxScale={4}
          limitToBounds={false}
          doubleClick={{ disabled: false, step: 0.5 }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>

            {/* exportRef: wraps ALL layers → toPng captures complete tree */}
            <div ref={exportRef} style={{ 
              position: "relative", 
              width: peopleInTree.length === 0 ? "100%" : canvasW, 
              height: peopleInTree.length === 0 ? "100%" : canvasH,
              minWidth: "100vw",
              minHeight: "100vh"
            }}>

              {peopleInTree.length > 0 && (
                <>
                  {/* Layer 1 — Themed background */}
                  <ThemeBackground themeKey={themeKey} t={t} w={canvasW} h={canvasH} />

                  {/* Layer 2 — Connector SVG
                      translate(PADDING, PADDING) aligns SVG coords with the card layer */}
                  {layout && (
                    <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
                      <g transform={`translate(${PADDING},${PADDING})`}>
                        <ConnectorLayer connectors={layout.connectors} lineColor={t.line} spouseColor={t.spouseLine} />
                      </g>
                    </svg>
                  )}

                  {/* Layer 3 — Person cards
                      left/top = PADDING: coordinate origin matches SVG translate above */}
                  <div className="absolute" style={{ left: PADDING, top: PADDING }}>
                    {layout && Array.from(layout.nodes.entries()).map(([pid, pos]) => {
                      const person = peopleMap.get(pid);
                      if (!person) return null;
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
                            onFocus={handleCardClick} onDrop={handleDrop}
                          />
                        </motion.div>
                      );
                    })}

                    {/* Layer 4 — Union collapse buttons (centered between partners) */}
                    {layout && unions.map(u => {
                      if (u.childrenIds.length === 0) return null;
                      const p1 = layout.nodes.get(u.partner1Id);
                      if (!p1) return null;
                      const midX = u.partner2Id
                        ? ((p1.x + (layout.nodes.get(u.partner2Id)?.x ?? p1.x)) / 2)
                        : p1.x;
                      const p2y = u.partner2Id ? (layout.nodes.get(u.partner2Id)?.y ?? p1.y) : p1.y;
                      const btnY = Math.max(p1.y, p2y) + CARD_H;
                      const isCollapsed = collapsedUnions.has(u.id);
                      return (
                        <button key={u.id}
                          onClick={() => toggleCollapse(u.id)}
                          title={isCollapsed ? 'Expand Branch' : 'Collapse Branch'}
                          className={cn(
                            "absolute z-20",
                            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                            "border-2 shadow-lg hover:scale-110 active:scale-90",
                            isCollapsed
                              ? "bg-primary text-white border-primary rotate-180"
                              : cn(t.cardBg, t.cardBorder, "text-slate-400 hover:text-primary")
                          )}
                          style={{ left: midX - 14, top: btnY + 6 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Empty state */}
              {peopleInTree.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                  <div className={cn("px-12 py-10 rounded-[2.5rem] border text-center shadow-xl max-w-md mx-auto", t.panel)}>
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6", t.chipOn)}>
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className={cn("text-xl font-black mb-3", t.text)}>Build Your Family Tree</h3>
                    <p className={cn("text-sm font-medium mb-8 leading-relaxed", t.muted)}>
                      Add your first family member and connect them to start visualizing your history.
                    </p>
                    <button onClick={() => setShowCreateModal(true)}
                      className={cn("px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95", t.chipOn)}>
                      Add First Member
                    </button>
                  </div>
                </div>
              )}

            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DRAWERS & MODALS
      ══════════════════════════════════════════════════════════════════ */}
      <ProfileDrawer
        person={drawerPersonId ? (allPeopleMap.get(drawerPersonId) ?? null) : null}
        peopleMap={allPeopleMap}
        isOpen={Boolean(drawerPersonId)}
        onClose={() => setDrawerPersonId(null)}
        onEdit={() => { if (drawerPersonId) router.push(`/person/${drawerPersonId}`); }}
        onDelete={handleDeletePerson}
        userRole={userRole}
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

      <DragRelationshipIndicator />
    </div>
  );
}

export default function FamilyTreeContainer({ treeId }: FamilyTreeProps) {
  return <TreeCanvas treeId={treeId} />;
}
