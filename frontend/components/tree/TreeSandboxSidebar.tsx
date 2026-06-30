"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { Search, UserPlus, Info, GripVertical, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { useTreeInteraction } from "./TreeInteractionProvider";

interface TreeSandboxSidebarProps {
  treeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPerson?: (id: string) => void;
  onAddNew?: () => void;
  onDrop?: (srcId: string, tgtId: string) => void;
}

export default function TreeSandboxSidebar({ 
  treeId, 
  isCollapsed = false, 
  onToggleCollapse, 
  onSelectPerson, 
  onAddNew, 
  onDrop 
}: TreeSandboxSidebarProps) {
  const [search, setSearch] = useState("");
  const { theme } = useAppTheme();
  const { t } = useLanguage();

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
       p.lastName?.toLowerCase().includes(search.toLowerCase()) ||
       p.nickname?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div 
      className={cn(
        "h-full flex flex-col transition-colors duration-500",
        theme.colors.sidebar.bg,
        "backdrop-blur-xl z-40 border",
        theme.colors.sidebar.border
      )}
    >
      <div className={cn("p-6 space-y-6 flex-shrink-0", isCollapsed && "px-3 p-4")}>
        <header className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
            <div className={cn("w-2 h-2 rounded-full animate-pulse", theme.colors.primary)} />
            <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme.colors.sidebar.activeText)}>
              {t('treeSandbox.title')}
            </h2>
          </div>
          <button 
            onClick={onToggleCollapse}
            className={cn("p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5", theme.colors.textMuted)}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </header>

        {!isCollapsed && (
          <>
            <h1 className={cn("text-xl font-black tracking-tight transition-colors duration-500", theme.colors.text)}>
              {t('treeSandbox.unlinkedMembers')}
            </h1>
            <div className="relative group">
              <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500", theme.colors.textMuted, "group-focus-within:" + theme.colors.accent)} />
              <input
                type="text"
                placeholder={t('treeSandbox.searchPlaceholder')}
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
          </>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto pb-8 space-y-3", isCollapsed ? "px-2" : "px-4")}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
             <Loader2 className={cn("w-6 h-6 animate-spin", theme.colors.accent)} />
             {!isCollapsed && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('treeSandbox.loading')}</p>}
          </div>
        ) : unlinkedPeople?.length === 0 ? (
          !isCollapsed && (
            <div className="py-12 px-6 text-center space-y-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                <Info className={cn("w-5 h-5 transition-colors duration-500", theme.colors.textMuted)} />
              </div>
              <p className={cn("text-sm font-medium", theme.colors.textMuted)}>{t('treeSandbox.allLinked')}</p>
            </div>
          )
        ) : (
          unlinkedPeople?.map((person) => (
            <DraggableSandboxItem 
              key={person.id} 
              person={person} 
              isCollapsed={isCollapsed}
              onClick={() => onSelectPerson?.(person.id)} 
              onDrop={onDrop}
            />
          ))
        )}
      </div>

      <div className={cn("p-4 border-t transition-colors duration-500 flex-shrink-0", theme.colors.border, isCollapsed && "px-2")}>
         <button 
           onClick={onAddNew}
           title={t('treeSandbox.addRelative')}
           className={cn(
           "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-pop-lg",
           theme.colors.primary,
           "text-white",
           isCollapsed && "py-3 px-0"
         )}>
            <UserPlus className="w-4 h-4" />
            {!isCollapsed && t('treeSandbox.addRelative')}
         </button>
      </div>
    </div>
  );
}

function DraggableSandboxItem({ person, isCollapsed, onClick, onDrop }: { person: any, isCollapsed: boolean, onClick: () => void, onDrop?: (src: string, tgt: string) => void }) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
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
        "rounded-3xl border group transition-all cursor-pointer",
        theme.colors.surface,
        theme.colors.border,
        "hover:shadow-pop-lg hover:border-primary/50",
        isCollapsed ? "p-2" : "p-4"
      )}
      onClick={onClick}
    >
      <div className={cn("flex items-center gap-4", isCollapsed && "flex-col gap-2")}>
        {!isCollapsed && (
          <div className={cn("p-2 rounded-xl transition-colors duration-500", theme.colors.bg)}>
            <GripVertical className={cn("w-4 h-4 transition-colors duration-500", theme.colors.textMuted, "group-hover:" + theme.colors.accent)} />
          </div>
        )}
        <div className={cn(
          "rounded-xl flex items-center justify-center font-black text-xs overflow-hidden flex-shrink-0",
          theme.colors.bg,
          theme.colors.textMuted,
          isCollapsed ? "w-10 h-10" : "w-10 h-10"
        )}>
          {person.imageUrl ? (
            <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            `${person.firstName[0]}${person.lastName?.[0] ?? ""}`.toUpperCase()
          )}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className={cn("font-bold text-sm truncate transition-colors duration-500", theme.colors.text)}>
                {person.firstName} {person.lastName}
              </p>
              {person.nickname && (
                <p className={cn("text-[10px] font-medium italic truncate transition-colors duration-500", theme.colors.textMuted)}>
                  {person.nickname}
                </p>
              )}
              <p className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors duration-500", theme.colors.textMuted)}>
                {person.status} • {t('treeSandbox.unlinked')}
              </p>
            </div>
            <button 
              // onClick={(e) => { e.stopPropagation(); /* Add logic to move to canvas */ }}
              className={cn(
                "p-2 rounded-lg group-hover:text-primary cursor-pointer transition-opacity", 
                "opacity-0 group-hover:opacity-100", // Show icon when parent is hovered
                theme.colors.textMuted
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
