"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Search, UserPlus, Info, Loader2, ChevronRight, ChevronLeft, Users, Star, Circle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { useTreeInteraction } from "./TreeInteractionProvider";

interface SandboxPanelProps {
  treeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPerson?: (id: string) => void;
  onAddNew?: () => void;
  onDrop?: (srcId: string, tgtId: string) => void;
  floating?: boolean;
}

const AVATAR_COLORS = ["#F97316", "#F472B6", "#14b8a6", "#A78BFA", "#38bdf8", "#FBBF24"];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* Decorative SVG elements for the sandbox background */
function SandboxDecorations() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {/* Corner decorative shapes */}
      <circle cx="8%" cy="6%" r="12%" fill="#F97316" opacity="0.04" />
      <circle cx="92%" cy="8%" r="8%" fill="none" stroke="#FBBF24" strokeWidth="0.5" opacity="0.05" />
      <circle cx="5%" cy="94%" r="6%" fill="#F472B6" opacity="0.04" />
      {/* Subtle dot scatter */}
      <circle cx="15%" cy="20%" r="0.8%" fill="#F97316" opacity="0.06" />
      <circle cx="80%" cy="30%" r="0.6%" fill="#FBBF24" opacity="0.05" />
      <circle cx="25%" cy="75%" r="0.7%" fill="#34D399" opacity="0.05" />
      <circle cx="70%" cy="85%" r="0.5%" fill="#F472B6" opacity="0.06" />
      <circle cx="50%" cy="12%" r="0.9%" fill="#F97316" opacity="0.04" />
      {/* Tiny stars */}
      <polygon points="20%,10% 20.5%,9% 21%,10% 19.5%,9.5% 20.5%,9.5%" fill="#FBBF24" opacity="0.06" />
      <polygon points="75%,15% 75.5%,14% 76%,15% 74.5%,14.5% 75.5%,14.5%" fill="#F472B6" opacity="0.05" />
      <polygon points="10%,50% 10.4%,49% 10.8%,50% 9.6%,49.6% 10.4%,49.6%" fill="#34D399" opacity="0.04" />
      <polygon points="85%,60% 85.4%,59% 85.8%,60% 84.6%,59.6% 85.4%,59.6%" fill="#F97316" opacity="0.05" />
    </svg>
  );
}

export default function SandboxPanel({
  treeId,
  isCollapsed = false,
  onToggleCollapse,
  onSelectPerson,
  onAddNew,
  onDrop,
  floating = false
}: SandboxPanelProps) {
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

  const unlinkedPeople = people?.filter(p =>
    (p.relationshipCount === 0) &&
      (p.firstName.toLowerCase().includes(search.toLowerCase()) ||
       p.lastName?.toLowerCase().includes(search.toLowerCase()) ||
       p.nickname?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={cn(
      "h-full flex flex-col transition-colors duration-500 relative",
      "bg-[#FFFDF5] dark:bg-[#1E293B]",
      "backdrop-blur-xl z-40",
      floating ? "" : "border-r",
    )}>
      <SandboxDecorations />

      <div className={cn("relative z-10 p-5 space-y-5 flex-shrink-0", isCollapsed && "px-3 p-4")}>
        <header className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
            <div className="relative">
              <Users className="w-4 h-4 text-[#F97316]" />
              <Star className="absolute -top-1.5 -right-1.5 w-2 h-2 fill-[#FBBF24] text-[#FBBF24]" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#F97316]">
              {t('treeSandbox.title')}
            </h2>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg transition-colors hover:bg-[#F97316]/10 text-muted-foreground hover:text-[#F97316]"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </header>

        {!isCollapsed && (
          <>
            {/* Section heading with decorative underline */}
            <div className="relative">
              <h1 className="text-lg font-black tracking-tight text-[#1E293B] dark:text-[#F8FAFC]">
                {t('treeSandbox.unlinkedMembers')}
              </h1>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-transparent" />
                <Circle className="w-2 h-2 fill-[#F472B6] text-[#F472B6]" />
              </div>
            </div>

            {/* Pill search */}
            <div className="relative group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500",
                "text-muted-foreground",
                "group-focus-within:text-[#F97316]"
              )} />
              <input
                type="text"
                placeholder={t('treeSandbox.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-full text-sm font-medium outline-none transition-all border-2",
                  "focus:ring-4 focus:ring-[#F97316]/10 focus:border-[#F97316]/50",
                  "bg-white dark:bg-[#0F172A]",
                  "border-[#E2E8F0] dark:border-[#334155]",
                  "text-[#1E293B] dark:text-[#F8FAFC]",
                  "shadow-[2px_2px_0px_rgba(15,23,42,0.06)]",
                )}
              />
            </div>
          </>
        )}
      </div>

      <div className={cn("relative z-10 flex-1 overflow-y-auto pb-6 space-y-2", isCollapsed ? "px-2" : "px-4")}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#F97316]" />
            {!isCollapsed && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('treeSandbox.loading')}</p>}
          </div>
        ) : unlinkedPeople?.length === 0 ? (
          !isCollapsed && (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-[#FFFDF5] dark:bg-[#0F172A] border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[2px_2px_0px_rgba(15,23,42,0.06)]">
                <Info className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t('treeSandbox.allLinked')}</p>
            </div>
          )
        ) : (
          unlinkedPeople?.map((person) => (
            <SandboxItem
              key={person.id}
              person={person}
              isCollapsed={isCollapsed}
              onClick={() => onSelectPerson?.(person.id)}
              onDrop={onDrop}
            />
          ))
        )}
      </div>

      {/* Add button with decorative accents */}
      <div className={cn("relative z-10 p-4 border-t border-[#E2E8F0] dark:border-[#334155] flex-shrink-0", isCollapsed && "px-2")}>
        {/* Decorative elements around button */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
          <circle cx="8%" cy="30%" r="1.5%" fill="#FBBF24" opacity="0.06" />
          <circle cx="92%" cy="40%" r="1%" fill="#F472B6" opacity="0.05" />
          <polygon points="85%,65% 85.4%,64% 85.8%,65% 84.6%,64.6% 85.4%,64.6%" fill="#34D399" opacity="0.05" />
          <polygon points="12%,70% 12.4%,69% 12.8%,70% 11.6%,69.6% 12.4%,69.6%" fill="#F97316" opacity="0.05" />
        </svg>
        <button
          onClick={onAddNew}
          title={t('treeSandbox.addRelative')}
          className={cn(
            "relative w-full h-[52px] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2",
            "hover:scale-[1.02] active:scale-[0.98] transition-all",
            "bg-[#F97316] hover:bg-[#EA580C] text-white",
            "border-2 border-[#1E293B]",
            "shadow-[4px_4px_0px_#1E293B]",
            isCollapsed && "h-12 px-0"
          )}
        >
          <UserPlus className="w-4 h-4" />
          {!isCollapsed && t('treeSandbox.addRelative')}
        </button>
      </div>
    </div>
  );
}

function SandboxItem({ person, isCollapsed, onClick, onDrop }: {
  person: any;
  isCollapsed: boolean;
  onClick: () => void;
  onDrop?: (src: string, tgt: string) => void;
}) {
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

  const avatarColor = getAvatarColor(person.id);
  const initials = `${person.firstName[0]}${person.lastName?.[0] ?? ""}`.toUpperCase();

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
        "rounded-2xl border-2 group transition-all cursor-pointer relative",
        "bg-white dark:bg-[#0F172A]",
        "border-[#E2E8F0] dark:border-[#334155]",
        "hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1E293B] hover:border-[#F97316]/50",
        "shadow-[3px_3px_0px_rgba(15,23,42,0.08)]",
        isCollapsed ? "p-2" : "p-3"
      )}
      onClick={onClick}
    >
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-6 h-6 rounded-bl-2xl" style={{ backgroundColor: `${avatarColor}15` }} />
      </div>

      <div className={cn("flex items-center gap-3", isCollapsed && "flex-col gap-2")}>
        {!isCollapsed && (
          <div className="p-1.5 rounded-xl bg-[#FFFDF5] dark:bg-[#1E293B]">
            <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#F97316] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="5" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="3" cy="12" r="1" />
              <circle cx="21" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
        )}
        <div className={cn(
          "rounded-xl flex items-center justify-center font-black text-xs overflow-hidden flex-shrink-0 text-white shadow-[2px_2px_0px_rgba(15,23,42,0.1)]",
          isCollapsed ? "w-10 h-10" : "w-9 h-9"
        )}
          style={{ backgroundColor: avatarColor }}
        >
          {person.imageUrl ? (
            <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : initials}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-[#1E293B] dark:text-[#F8FAFC]">
                {person.firstName} {person.lastName}
              </p>
              {person.nickname && (
                <p className="text-[10px] font-medium italic truncate text-muted-foreground">
                  {person.nickname}
                </p>
              )}
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                {person.status} • {t('treeSandbox.unlinked')}
              </p>
            </div>
            <button className="p-2 rounded-lg text-muted-foreground group-hover:text-[#F97316] cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
