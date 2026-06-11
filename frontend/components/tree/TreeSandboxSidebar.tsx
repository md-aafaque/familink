"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { Search, UserPlus, Info, GripVertical, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useAppTheme } from "../providers/ThemeProvider";
import { cn } from "@/lib/cn";
import { useTreeInteraction } from "./TreeInteractionProvider";

interface TreeSandboxSidebarProps {
  treeId: string;
  onSelectPerson?: (id: string) => void;
  onAddNew?: () => void;
  onDrop?: (srcId: string, tgtId: string) => void;
}

export default function TreeSandboxSidebar({ treeId, onSelectPerson, onAddNew, onDrop }: TreeSandboxSidebarProps) {
  const [search, setSearch] = useState("");
  const { theme } = useAppTheme();

  const { data: people, isLoading } = useQuery({
    queryKey: ["tree-people-sandbox", treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/people`);
      return (res as any).data as any[];
    },
  });

  // Filter people who have zero relationships
  const unlinkedPeople = people?.filter(p => 
    (p.relationshipCount === 0) &&
    (p.firstName.toLowerCase().includes(search.toLowerCase()) || 
     p.lastName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={cn(
      "w-80 h-full flex flex-col border-r transition-colors duration-500",
      theme.colors.sidebar.bg,
      theme.colors.sidebar.border,
      "backdrop-blur-xl z-40"
    )}>
      <div className="p-6 space-y-6">
        <header>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", theme.colors.primary)} />
            <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme.colors.sidebar.activeText)}>
              Sandbox
            </h2>
          </div>
          <h1 className={cn("text-xl font-black tracking-tight transition-colors duration-500", theme.colors.text)}>
            Unlinked Members
          </h1>
        </header>

        <div className="relative group">
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500", theme.colors.textMuted, "group-focus-within:" + theme.colors.accent)} />
          <input
            type="text"
            placeholder="Search sandbox..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all border focus:ring-4 focus:ring-primary/10 focus:border-primary/50",
              theme.colors.bg,
              theme.colors.border,
              theme.colors.text
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
             <Loader2 className={cn("w-6 h-6 animate-spin", theme.colors.accent)} />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Members</p>
          </div>
        ) : unlinkedPeople?.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
              <Info className={cn("w-5 h-5 transition-colors duration-500", theme.colors.textMuted)} />
            </div>
            <p className={cn("text-sm font-medium", theme.colors.textMuted)}>All members are currently linked to the tree.</p>
          </div>
        ) : (
          unlinkedPeople?.map((person) => (
            <DraggableSandboxItem 
              key={person.id} 
              person={person} 
              onClick={() => onSelectPerson?.(person.id)} 
              onDrop={onDrop}
            />
          ))
        )}
      </div>

      <div className={cn("p-4 border-t transition-colors duration-500", theme.colors.border)}>
         <button 
           onClick={onAddNew}
           className={cn(
           "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl",
           theme.colors.primary,
           "text-white"
         )}>
            <UserPlus className="w-4 h-4" />
            Add New Relative
         </button>
      </div>
    </div>
  );
}

function DraggableSandboxItem({ person, onClick, onDrop }: { person: any, onClick: () => void, onDrop?: (src: string, tgt: string) => void }) {
  const { theme } = useAppTheme();
  const { 
    setDraggingPersonId, 
    hoveredPersonId, 
    setDragCoordinates, 
    setDragStartCoords,
    setDragHistory,
    dragHistory
  } = useTreeInteraction();
  
  const handleDragStart = (event: any, info: any) => {
    setDraggingPersonId(person.id);
    document.body.style.cursor = 'grabbing';
    setDragStartCoords({ x: info.point.x, y: info.point.y });
    setDragHistory([{ x: info.point.x, y: info.point.y }]);
  };

  const handleDragEnd = () => {
    if (hoveredPersonId && onDrop) {
      onDrop(person.id, hoveredPersonId);
    }
    setDraggingPersonId(null);
    setDragCoordinates(null);
    setDragStartCoords(null);
    setDragHistory([]);
    document.body.style.cursor = 'default';
  };

  const handleDrag = (event: any, info: any) => {
    const current = { x: info.point.x, y: info.point.y };
    setDragCoordinates(current);
    
    // Maintain a longer history for a slower-fading trail
    setDragHistory([...dragHistory.slice(-50), current]);
  };

  return (
    <motion.div
      layout
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.05}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      whileDrag={{ 
        scale: 1.05, 
        zIndex: 100,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        cursor: "grabbing"
      }}
      className={cn(
        "p-4 rounded-[1.5rem] border group transition-all cursor-pointer",
        theme.colors.surface,
        theme.colors.border,
        "hover:shadow-lg",
        "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-xl transition-colors duration-500", theme.colors.bg)}>
           <GripVertical className={cn("w-4 h-4 transition-colors duration-500", theme.colors.textMuted, "group-hover:" + theme.colors.accent)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-bold text-sm truncate transition-colors duration-500", theme.colors.text)}>
            {person.firstName} {person.lastName}
          </p>
          <p className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors duration-500", theme.colors.textMuted)}>
            {person.status} • Unlinked
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); /* Add logic to move to canvas */ }}
          className={cn(
            "p-2 rounded-lg group-hover:text-primary cursor-pointer transition-opacity", 
            "opacity-0 group-hover:opacity-100", // Show icon when parent is hovered
            theme.colors.textMuted
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
