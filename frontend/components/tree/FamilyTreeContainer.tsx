"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import TreeCard from "./TreeCard";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface FamilyTreeProps {
  treeId: string;
}

interface PersonNode {
  id: string;
  firstName: string;
  lastName?: string;
  status: string;
  birthDate?: string;
  deathDate?: string;
  children: PersonNode[];
  relationships?: Array<{ type: string; targetId: string }>;
}

export default function FamilyTreeContainer({ treeId }: FamilyTreeProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["tree-visual", treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/visual`);
      return (res as any).data as any[];
    },
  });

  // Optimized layout logic: Find the "root" persons
  const treeData = useMemo(() => {
    if (!rawData) return null;

    const peopleMap = new Map<string, PersonNode>(
      rawData.map((p: any) => [p.id, { ...p, children: [] }])
    );
    
    // Track who is a child
    const childIds = new Set<string>();
    rawData.forEach((p: any) => {
      p.relationships?.forEach((rel: any) => {
        if (rel.type === 'parent') {
          childIds.add(rel.targetId);
        }
      });
    });

    // Roots are people who are not children of anyone in this dataset
    const roots: PersonNode[] = [];
    rawData.forEach((p: any) => {
      if (!childIds.has(p.id)) {
        const person = peopleMap.get(p.id);
        if (person) roots.push(person);
      }
    });

    // Link children (already O(N))
    rawData.forEach((p: any) => {
      const parent = peopleMap.get(p.id);
      if (!parent) return;

      p.relationships?.forEach((rel: any) => {
        if (rel.type === 'parent') {
          const child = peopleMap.get(rel.targetId);
          if (child && !parent.children.some(c => c.id === child.id)) {
            parent.children.push(child);
          }
        }
      });
    });

    return roots;
  }, [rawData]);

  const toggleCollapse = (id: string) => {
    const newCollapsed = new Set(collapsedIds);
    if (newCollapsed.has(id)) newCollapsed.delete(id);
    else newCollapsed.add(id);
    setCollapsedIds(newCollapsed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  const renderBranch = (person: PersonNode) => {
    const isCollapsed = collapsedIds.has(person.id);
    const hasChildren = person.children && person.children.length > 0;

    return (
      <div key={person.id} className="flex flex-col items-center">
        <TreeCard
          person={person}
          isFocus={focusId === person.id}
          onFocus={setFocusId}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleCollapse(person.id)}
        />

        {!isCollapsed && hasChildren && (
          <div className="relative pt-8">
            {/* Horizontal line connector */}
            {person.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-200" 
                   style={{ width: `calc(100% - ${200 / person.children.length}px)` }} />
            )}
            
            <div className="flex gap-12 justify-center">
              {person.children.map((child: PersonNode) => (
                <div key={child.id} className="relative">
                  {/* Vertical line from horizontal line to child */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200" />
                  {renderBranch(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[700px] bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner">
      <TransformWrapper
        initialScale={0.8}
        minScale={0.2}
        maxScale={2}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Toolbar */}
            <div className="absolute top-8 right-8 z-30 flex flex-col gap-2">
              <button onClick={() => zoomIn()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-lg hover:bg-slate-50 transition-all text-slate-600">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={() => zoomOut()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-lg hover:bg-slate-50 transition-all text-slate-600">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button onClick={() => resetTransform()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-lg hover:bg-slate-50 transition-all text-slate-600">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div className="p-40 min-w-[2000px] flex justify-center">
                <AnimatePresence>
                  <motion.div 
                    layout
                    className="flex gap-20 justify-center items-start"
                  >
                    {treeData?.map(root => root && renderBranch(root))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Legend / Status */}
      <div className="absolute bottom-8 left-8 z-30 bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white shadow-xl space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</h3>
        <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Click to focus member
        </p>
        <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          Drag to pan • Scroll to zoom
        </p>
      </div>
    </div>
  );
}
