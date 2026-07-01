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
  Loader2, Heart,
  Search, X, ChevronDown, Grid3X3, Leaf, ScrollText, Moon,
  Users,
} from "lucide-react";
import SandboxPanel from "./SandboxPanel";
import RelationshipProposalModal from "../RelationshipProposalModal";
import { useRouter } from "next/navigation";
import CreatePersonModal from "../CreatePersonModal";
import { cn } from "@/lib/cn";
import SoftShapes from "./backgrounds/SoftShapes";
import Sparkles from "./backgrounds/Sparkles";
import FamilyMotifs from "./backgrounds/FamilyMotifs";
import TreeNodeCard, { getNodeAccent } from "./TreeNodeCard";
import ConnectionLine from "./ConnectionLine";
import CanvasToolbar from "./CanvasToolbar";
import DragRelationshipIndicator from "./DragRelationshipIndicator";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useIsMobile } from "@/lib/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface FamilyTreeProps { treeId: string }

interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
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
  collapsed?: boolean;
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
const CARD_W       = 260; // Larger for premium feel
const CARD_H       = 100; // Taller cards
const H_GAP        = 120; // Breathing room
const V_GAP        = 160; // Vertical space for connectors
const SPOUSE_GAP   = 64;  
const COUPLE_W     = CARD_W + SPOUSE_GAP + CARD_W;
const PADDING      = 120;
const INITIAL_SCALE = 0.55;

// Unit width used as the d3 nodeSize base and the separation denominator.
const UNIT_W = CARD_W + H_GAP;

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    name: "Light", Icon: Grid3X3,
    canvas: "#FFFDF5", gridDot: "#c8d5e3", dotR: 0.85,
    line: "#94a3b8", spouseLine: "#f59e0b", accent: "#f59e0b",
    panel:   "bg-card/80 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-sm",
    toolbar: "bg-card/90 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-lg",
    text: "text-foreground", muted: "text-muted-foreground",
    chipOn:  "bg-primary text-primary-foreground",
    chipOff: "text-muted-foreground hover:bg-muted hover:text-foreground",
    iconBtn: "bg-card/80 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-sm text-muted-foreground hover:text-foreground",
    cardBg: "bg-card", cardBorder: "border-muted-foreground/30",
  },
  dark: {
    name: "Dark", Icon: Moon,
    canvas: "#0F172A", gridDot: "#1a2233", dotR: 0.75,
    line: "#263045", spouseLine: "#3b82f6", accent: "#3b82f6",
    panel:   "bg-card/90 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-sm shadow-black/30",
    toolbar: "bg-card/95 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-lg shadow-black/50",
    text: "text-foreground", muted: "text-muted-foreground",
    chipOn:  "bg-primary text-primary-foreground",
    chipOff: "text-muted-foreground hover:bg-muted hover:text-foreground",
    iconBtn: "bg-card/90 backdrop-blur-xl border border-muted-foreground/30 shadow-pop-sm text-muted-foreground hover:text-foreground",
    cardBg: "bg-card", cardBorder: "border-muted-foreground/30",
  },
  sepia: {
    name: "Sepia", Icon: ScrollText,
    canvas: "#FFFDF5", gridDot: "#d9c9a3", dotR: 0.9,
    line: "#b09070", spouseLine: "#c17a3a", accent: "#9a6b2e",
    panel:   "bg-card/90 backdrop-blur-xl border border-amber-200/60 shadow-pop-sm shadow-amber-100/30",
    toolbar: "bg-card/95 backdrop-blur-xl border border-amber-300/50 shadow-pop-lg shadow-amber-100/40",
    text: "text-foreground", muted: "text-muted-foreground",
    chipOn:  "bg-amber-700 text-white",
    chipOff: "text-amber-700 hover:bg-amber-100 hover:text-amber-900",
    iconBtn: "bg-card/90 backdrop-blur-xl border border-amber-200/60 shadow-pop-sm text-amber-700 hover:text-amber-900",
    cardBg: "bg-card", cardBorder: "border-amber-200/70",
  },
  forest: {
    name: "Forest", Icon: Leaf,
    canvas: "#FFFDF5", gridDot: "#b0ccb0", dotR: 0.85,
    line: "#68966a", spouseLine: "#34d399", accent: "#16a34a",
    panel:   "bg-card/85 backdrop-blur-xl border border-emerald-200/60 shadow-pop-sm shadow-emerald-100/30",
    toolbar: "bg-card/90 backdrop-blur-xl border border-emerald-200/60 shadow-pop-lg shadow-emerald-100/40",
    text: "text-foreground", muted: "text-muted-foreground",
    chipOn:  "bg-emerald-600 text-white",
    chipOff: "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800",
    iconBtn: "bg-card/85 backdrop-blur-xl border border-emerald-200/60 shadow-pop-sm text-emerald-600 hover:text-emerald-800",
    cardBg: "bg-card", cardBorder: "border-emerald-200/70",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
type Theme    = (typeof THEMES)[ThemeKey];

// ─────────────────────────────────────────────────────────────────────────────
// Theme Background SVG
// ─────────────────────────────────────────────────────────────────────────────
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
          parentBottomY: visualY + CARD_H,
          childXs: node.children.map(c => c.x! + xShift),
          childTopY: (node.depth) * (CARD_H + V_GAP)
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

    // Push connector when node has children, was collapsed, or has a spouse
    // (preserve spouse line + vertical stem). Genuine leaf nodes get none.
    if (node.children || node.data.collapsed || spouseIds.length > 0) {
      const lastSpouseX = curX;
      connectors.push({
        id: `rel-${personId}`,
        p1x: pX,
        p2x: lastSpouseX,
        parentBottomY: visualY + CARD_H,
        childXs: node.children ? node.children.map(c => c.x! + xShift) : [],
        childTopY: (node.depth) * (CARD_H + V_GAP),
        collapsed: node.data.collapsed,
      });
    }
  });

  const allPos = Array.from(positions.values());
  const totalWidth  = allPos.length ? Math.max(...allPos.map(p => p.x)) + CARD_W / 2 : 0;
  const totalHeight = allPos.length ? Math.max(...allPos.map(p => p.y)) + CARD_H + 100 : 0;

  return { nodes: positions, connectors, totalWidth, totalHeight };
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  // Tracks whether the initial centering has fired (for delay logic)
  const centeredRef    = useRef(false);

  const { theme: appTheme } = useAppTheme();
  const { t: tLang } = useLanguage();
  const [themeKey, setThemeKey] = useState<ThemeKey>(appTheme.isDark ? "dark" : "light");

  useEffect(() => {
    setThemeKey(appTheme.isDark ? "dark" : "light");
  }, [appTheme.isDark]);

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
  const [activeTool, setActiveTool] = useState<"select" | "connect" | "layout">("select");
  const [mobileSandboxOpen, setMobileSandboxOpen] = useState(false);
  const isMobile = useIsMobile();

  // Collapse search when drawer opens
  useEffect(() => {
    if (drawerPersonId) setSearchOpen(false);
  }, [drawerPersonId]);

  // Click outside search container → close dropdown (always), collapse bar too when drawer is open
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerPersonId, searchOpen]);

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
      `${p.firstName} ${p.lastName ?? ""} ${p.nickname ?? ""}`.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [peopleInTree, searchQuery]);

  const searchHitIds = useMemo(() => new Set(searchResults.map(p => p.id)), [searchResults]);

  const openSearch  = useCallback(() => { setSearchOpen(true);  setTimeout(() => searchInputRef.current?.focus(), 80); }, []);
  const closeSearch = useCallback(() => { setSearchOpen(false); }, []);

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

    // Viewport = full canvas div (sidebar floats above, doesn't steal width)
    const vpW = canvasDivRef.current?.clientWidth  ?? window.innerWidth;
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
  }, [layout]);

  useEffect(() => {
    if (!layout) return;

    // Short delay lets the DOM paint before we measure; longer on re‑centers

    const delay = centeredRef.current ? 380 : 150;
    centeredRef.current = true;
    const timer = setTimeout(centerTree, delay);
    return () => clearTimeout(timer);
  }, [layout, centerTree]);

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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return null; // Parent page handles initial loading
  }

  const isLayoutComputing = peopleInTree.length > 0 && !layout;

  const canvasW = (layout?.totalWidth  ?? 0) + PADDING * 2;
  const canvasH = (layout?.totalHeight ?? 0) + PADDING * 2;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          LEFT SIDEBAR — Sandbox (desktop only; mobile uses bottom sheet)
      ══════════════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <div className={cn(
          "absolute z-30 transition-all duration-300 rounded-2xl shadow-pop-xl overflow-hidden border",
          "top-4 bottom-4",
          isSidebarCollapsed ? "left-4 w-[72px]" : "left-4 w-[300px]",
          "bg-[#FFFDF5] dark:bg-[#1E293B]",
          "border-[#E2E8F0] dark:border-[#334155]"
        )}>
          <SandboxPanel 
            treeId={treeId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onAddNew={() => setShowCreateModal(true)}
            onSelectPerson={handleCardClick}
            onDrop={handleDrop}
            floating
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CANVAS  (full‑bleed)
          All overlays are children here — canvas-relative coordinates.
          canvasDivRef gives accurate clientWidth for centering.
      ══════════════════════════════════════════════════════════════════ */}
      <div ref={canvasDivRef} className="w-full h-full relative overflow-hidden"
        style={{ backgroundColor: "transparent" }}>

        {/* Canvas overlay — inset-0 */}
        {peopleInTree.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20">

            {/* Stats — to the right of sandbox, bottom-aligned */}
            <div className="absolute pointer-events-auto flex items-center gap-2 z-30"
              style={{ bottom: 20, left: isSidebarCollapsed ? 96 : 324 }}>
                <div className={cn("flex items-center gap-2 px-4 h-9 rounded-xl border-2 text-[11px] font-bold shadow-pop-sm", t.panel, t.cardBorder, t.muted)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{peopleInTree.length}</span>
                  <span className="opacity-40">&middot;</span>
                  <span>{unions.length} {tLang('treePage.connections')}</span>
                </div>
                {isMobile && (
                  <button
                    onClick={() => setMobileSandboxOpen(true)}
                    className={cn("h-9 px-3 rounded-xl border-2 text-[11px] font-bold shadow-pop-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95", t.panel, t.cardBorder, t.text)}
                    aria-label="Open people list"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{tLang('treeSandbox.title')}</span>
                  </button>
                )}
              </div>

            <CanvasToolbar
              transformRef={transformRef}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFS}
              themeKey={themeKey}
              onThemeToggle={() => setThemeKey(k => k === 'dark' ? 'light' : 'dark')}
              showGrid={false}
              onToggleGrid={() => {}}
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />
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
              minWidth: "100%",
              minHeight: "100%"
            }}>

              {peopleInTree.length > 0 && (
                <>
                  {/* Layers 1–4 — Decorative canvas background (pan/zoom with tree) */}
                  <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${canvasW} ${canvasH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <defs>
                      <pattern id={`bg-dots-${themeKey}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="0.5" cy="0.5" r={t.dotR} fill={t.gridDot} opacity="0.08" />
                      </pattern>
                      <radialGradient id={`bg-glow-${themeKey}`} cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor={t.accent} stopOpacity="0.04" />
                        <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Layer 0: Canvas fill */}
                    <rect width="100%" height="100%" fill={t.canvas} />

                    {/* Layer 1: Dot grid at 0.08 opacity */}
                    <rect width="100%" height="100%" fill={`url(#bg-dots-${themeKey})`} />

                    {/* Layer 2: Soft geometric shapes */}
                    <SoftShapes accentColor={t.accent} themeKey={themeKey} />

                    {/* Layer 3: Mini decorations — sparkles */}
                    <Sparkles accentColor={t.accent} themeKey={themeKey} />

                    {/* Layer 4: Family motifs */}
                    <FamilyMotifs accentColor={t.accent} themeKey={themeKey} />

                    {/* Glow overlay */}
                    <rect width="100%" height="100%" fill={`url(#bg-glow-${themeKey})`} />
                  </svg>

                  {/* Layer 2 — Connector SVG + connection markers */}
                  {layout && (
                    <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${canvasW} ${canvasH}`} preserveAspectRatio="xMidYMid slice">
                      <g transform={`translate(${PADDING},${PADDING})`}>
                        <ConnectionLine
                          connectors={layout.connectors}
                          lineColor={t.line}
                          spouseColor={t.spouseLine}
                          themeKey={themeKey}
                        />
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
                          <TreeNodeCard
                            person={person} accentHex={getNodeAccent(person)}
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
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                            "border-2 shadow-pop-lg hover:scale-125 active:scale-95",
                            "font-bold",
                            isCollapsed
                              ? "bg-primary text-primary-foreground border-primary rotate-180"
                              : cn(t.cardBg, "text-muted-foreground hover:text-primary", t.cardBorder)
                          )}
                          style={{ left: midX - 16, top: btnY + 6 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Layout computing spinner */}
              {isLayoutComputing && (
                <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                  <div className={cn("flex flex-col items-center gap-5 px-10 py-8 rounded-2xl", t.panel)}>
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: themeKey === 'dark' ? '#334155' : '#E2E8F0',
                                 borderTopColor: themeKey === 'dark' ? '#FB923C' : '#F97316' }} />
                      <Heart className="absolute inset-0 m-auto w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", t.muted)}>{tLang('treePage.loading')}</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {peopleInTree.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                  <div className={cn("px-12 py-10 rounded-3xl border-2 text-center shadow-pop-xl max-w-md mx-auto", t.panel, t.cardBorder)}>
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-pop-sm", t.chipOn)}>
                      <Users className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className={cn("text-xl font-black mb-3", t.text)}>{tLang('treePage.empty.title')}</h3>
                    <p className={cn("text-sm font-bold mb-8 leading-relaxed", t.muted)}>
                      {tLang('treePage.empty.subtitle')}
                    </p>
                    <button onClick={() => setShowCreateModal(true)}
                      className={cn("px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-pop-lg hover:scale-105 active:scale-95", t.chipOn)}>
                      {tLang('treePage.empty.button')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Search — expanded when no drawer, icon-only when drawer open */}
      {peopleInTree.length > 0 && (
        <div ref={searchContainerRef} className="absolute z-40 pointer-events-auto"
          style={{ top: 16, right: drawerPersonId ? 460 : 16 }}>
          <motion.div             animate={{ width: drawerPersonId && !searchOpen ? 36 : 240 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("h-10 rounded-xl border-2 flex items-center overflow-hidden transition-shadow", t.panel, t.cardBorder)}>
            <button onClick={drawerPersonId ? (searchOpen ? closeSearch : openSearch) : undefined}
              className={cn("min-w-[36px] h-full flex items-center justify-center flex-shrink-0 transition-colors", t.muted, "hover:opacity-70")}>
              <Search className="w-4 h-4" />
            </button>
            {(!drawerPersonId || searchOpen) && (
              <input ref={searchInputRef} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!searchOpen) openSearch(); }}
                onFocus={() => { if (!searchOpen) openSearch(); }}
                placeholder="Search people&hellip;" className={cn("flex-1 bg-transparent outline-none text-xs font-semibold pr-2 min-w-0", t.text)} />
            )}
            {(!drawerPersonId || searchOpen) && searchQuery && (
              <button onClick={() => setSearchQuery("")} className={cn("mr-2 flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors", t.muted)}>
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>

          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }}
                className={cn("absolute top-12 left-0 w-60 rounded-2xl overflow-hidden shadow-pop-lg border-2", t.panel, t.cardBorder)}>
                <div className="py-1">
                  {searchResults.map((p) => (
                    <button key={p.id} onClick={() => { handleCardClick(p.id); closeSearch(); }}
                      className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted")}>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-pop-sm"
                        style={{ backgroundColor: t.accent }}>
                        {p.firstName[0]}{p.lastName?.[0] ?? ""}
                      </span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold truncate leading-tight", t.text)}>{p.firstName} {p.lastName}</p>
                        {p.nickname && <p className={cn("text-[9px] italic font-medium", t.muted)}>{p.nickname}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT DRAWER — Profile floating card (desktop only; mobile uses full-screen)
      ══════════════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <AnimatePresence>
          {drawerPersonId && (
            <motion.div
              key="profile-drawer"
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute z-30 right-4 top-4 bottom-4 w-[420px] rounded-2xl shadow-pop-xl overflow-hidden"
              style={{
                backgroundColor: appTheme.isDark ? '#1E293B' : '#FFFDF5',
                border: `1px solid ${appTheme.isDark ? '#334155' : '#E2E8F0'}`
              }}
            >
              <div className="w-full h-full overflow-y-auto">
                <ProfileDrawer
                  person={allPeopleMap.get(drawerPersonId) ?? null}
                  peopleMap={allPeopleMap}
                  isOpen={true}
                  onClose={() => setDrawerPersonId(null)}
                  onEdit={() => { if (drawerPersonId) router.push(`/person/${drawerPersonId}`); }}
                  onDelete={handleDeletePerson}
                  userRole={userRole}
                  onProposeRelationship={() => { if (drawerPersonId) { setProposalSrc(drawerPersonId); setProposalTgt(""); } }}
                  treeId={treeId}
                  placement="panel"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE — Bottom sheet for Sandbox
      ══════════════════════════════════════════════════════════════════ */}
      {isMobile && (
        <AnimatePresence>
          {mobileSandboxOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSandboxOpen(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] min-h-[75vh] rounded-t-3xl overflow-hidden"
                style={{ backgroundColor: appTheme.isDark ? '#1E293B' : '#FFFFFF' }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
                </div>
                <div className="h-full overflow-y-auto pb-8">
                  <SandboxPanel 
                    treeId={treeId}
                    isCollapsed={false}
                    onToggleCollapse={() => {}}
                    onAddNew={() => setShowCreateModal(true)}
                    onSelectPerson={(id) => { handleCardClick(id); setMobileSandboxOpen(false); }}
                    onDrop={handleDrop}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE — Full-screen Profile drawer
      ══════════════════════════════════════════════════════════════════ */}
      {isMobile && (
        <AnimatePresence>
          {drawerPersonId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerPersonId(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 250 }}
                className="fixed inset-0 z-50 overflow-y-auto"
                style={{ backgroundColor: appTheme.isDark ? '#0F172A' : '#FFFDF5' }}
              >
                <div className="relative min-h-full">
                  <button
                    onClick={() => setDrawerPersonId(null)}
                    className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-muted-foreground/30 text-foreground shadow-pop-sm"
                    aria-label="Back"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <ProfileDrawer
                    person={allPeopleMap.get(drawerPersonId) ?? null}
                    peopleMap={allPeopleMap}
                    isOpen={true}
                    onClose={() => setDrawerPersonId(null)}
                    onEdit={() => { if (drawerPersonId) router.push(`/person/${drawerPersonId}`); }}
                    onDelete={handleDeletePerson}
                    userRole={userRole}
                    onProposeRelationship={() => { if (drawerPersonId) { setProposalSrc(drawerPersonId); setProposalTgt(""); } }}
                    treeId={treeId}
                    placement="panel"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS (not part of the 3-panel layout)
      ══════════════════════════════════════════════════════════════════ */}
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
