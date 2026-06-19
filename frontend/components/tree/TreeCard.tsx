"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Heart, ChevronDown, ChevronUp, ExternalLink, MoreVertical, Edit3, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useTreeInteraction } from "./TreeInteractionProvider";
import ContextMenu from "./ContextMenu";

interface TreeCardProps {
  person: any;
  isFocus?: boolean;
  isSearchResult?: boolean;
  onFocus?: (id: string) => void;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onDropPerson?: (sourceId: string, targetId: string) => void;
  treeTheme?: any;
}

const TreeCard = memo(({ 
  person, 
  isFocus, 
  isSearchResult,
  onFocus, 
  hasChildren, 
  isCollapsed, 
  onToggleCollapse,
  onDropPerson,
  treeTheme
}: TreeCardProps) => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const { draggingPersonId } = useTreeInteraction();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName[0]}${lastName ? lastName[0] : ''}`.toUpperCase();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      className={cn(
        "relative flex flex-col items-center group",
        isFocus ? "z-40" : "z-10"
      )}
    >
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        onMouseUp={() => {
          if (draggingPersonId && draggingPersonId !== person.id) {
            onDropPerson?.(draggingPersonId, person.id);
          }
        }}
        onClick={() => {
          onFocus?.(person.id);
        }}
        className={cn(
          "w-64 h-[20rem] p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-6",
          treeTheme?.card || cn(theme.colors.surface, theme.colors.border),
          isFocus ? "ring-8 ring-primary/10 scale-105 border-primary/50" : "hover:border-primary/30",
          isSearchResult && !isFocus ? "ring-4 ring-blue-400/50 border-blue-400" : "",
          draggingPersonId && draggingPersonId !== person.id && "ring-8 ring-primary/20 border-primary animate-pulse bg-primary/5"
        )}
      >
        {/* Production Detail: Background Glow */}
        {isFocus && (
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
        )}

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Avatar Area */}
          <div className="relative">
            <div className={cn(
              "w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-700 shadow-inner border-4 overflow-hidden",
              isFocus
                ? "rotate-6 border-primary/20 bg-primary/5"
                : "group-hover:-rotate-3 border-transparent bg-slate-100 dark:bg-slate-800"
            )}>
              {person.imageUrl ? (
                <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className={cn("text-2xl font-black transition-colors duration-500", isFocus ? "text-primary" : "text-slate-400")}>
                  {getInitials(person.firstName, person.lastName)}
                </span>
              )}
            </div>
            
            {/* Live Status Indicator */}
            {person.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 shadow-xl" />
            )}
          </div>
          
          <div className="space-y-3 w-full">
            <h4 className={cn("font-black text-xl tracking-tight leading-tight truncate px-2", theme.colors.text)} style={{ color: treeTheme?.accent }}>
              {person.firstName} {person.lastName}
            </h4>
            
            <div className="flex flex-wrap gap-1.5 justify-center">
              {person.status === 'ghost' && (
                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors duration-500", theme.isDark ? "bg-slate-800 text-slate-400 border-white/5" : "bg-slate-100 text-slate-500 border-slate-200/30")}>Ghost</span>
              )}
              {person.deathDate && (
                <span className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">Deceased</span>
              )}
              {person.status === 'active' && (
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors duration-500 shadow-sm bg-primary/10 text-primary border-primary/20")}>Verified</span>
              )}
            </div>
          </div>

          {person.birthDate && (
            <p className={cn(
              "text-[12px] font-black tracking-widest opacity-30 uppercase",
              theme.colors.textMuted
            )} style={{ color: treeTheme?.accent }}>
              {person.birthDate.substring(0, 4)} — {person.deathDate ? person.deathDate.substring(0, 4) : (person.status === 'deceased' ? "" : "Present")}
            </p>
          )}
        </div>

        {/* Floating Quick Links */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               router.push(`/person/${person.id}`);
             }}
             className={cn(
               "p-2.5 rounded-xl shadow-2xl border transition-all hover:scale-110 active:scale-90",
               theme.colors.surface,
               theme.colors.border,
               theme.colors.textMuted,
               "hover:" + theme.colors.accent
             )}
             title={t('treeCard.fullProfile')}
           >
             <ExternalLink className="w-4 h-4" />
           </button>
        </div>

        {/* Relationship Context Marker */}
        {person.isSpouse && (
          <div className={cn(
            "absolute -left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full border-2 shadow-2xl z-20 animate-in zoom-in duration-500",
            theme.colors.surface,
            theme.colors.border
          )}>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              { label: t('treeCard.viewFullProfile'), icon: User, onClick: () => router.push(`/person/${person.id}`) },
              { label: 'Edit Member Details', icon: Edit3, onClick: () => {} },
              { label: 'Grant Permissions', icon: ShieldCheck, onClick: () => {} },
              { label: 'Remove from Tree', icon: Trash2, onClick: () => {}, variant: 'danger' },
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

TreeCard.displayName = "TreeCard";
export default TreeCard;
