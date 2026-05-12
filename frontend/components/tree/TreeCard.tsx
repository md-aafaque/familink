"use client";

import { motion } from "framer-motion";
import { User, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { memo } from "react";

interface TreeCardProps {
  person: any;
  isFocus?: boolean;
  onFocus?: (id: string) => void;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TreeCard = memo(({ 
  person, 
  isFocus, 
  onFocus, 
  hasChildren, 
  isCollapsed, 
  onToggleCollapse 
}: TreeCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        "relative flex flex-col items-center group",
        isFocus ? "z-20" : "z-10"
      )}
    >
      <div
        onClick={() => onFocus?.(person.id)}
        className={cn(
          "w-48 p-4 rounded-3xl border-2 transition-all cursor-pointer shadow-lg",
          isFocus 
            ? "bg-orange-600 border-orange-400 text-white shadow-orange-200" 
            : "bg-white border-slate-100 text-slate-900 hover:border-orange-200 shadow-slate-200/50"
        )}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
            isFocus ? "bg-orange-500" : "bg-orange-50"
          )}>
            <User className={cn("w-6 h-6", isFocus ? "text-white" : "text-orange-600")} />
          </div>
          
          <div className="space-y-1">
            <h4 className="font-black text-sm leading-tight truncate w-40">
              {person.firstName} {person.lastName}
            </h4>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isFocus ? "text-orange-200" : "text-slate-400"
            )}>
              {person.status}
            </p>
          </div>

          {person.birthDate && (
            <p className={cn(
              "text-[10px] font-medium",
              isFocus ? "text-orange-100" : "text-slate-500"
            )}>
              {new Date(person.birthDate).getFullYear()} — {person.deathDate ? new Date(person.deathDate).getFullYear() : "Present"}
            </p>
          )}
        </div>

        {/* Spouse indicator if needed - simplified for this view */}
        {person.isSpouse && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-pink-500 p-1.5 rounded-full border-2 border-white shadow-md">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      {hasChildren && onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="mt-4 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all z-30"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      )}

      {/* Vertical connection line part */}
      {!isCollapsed && hasChildren && (
        <div className="w-px h-8 bg-slate-200" />
      )}
    </motion.div>
  );
});

TreeCard.displayName = "TreeCard";
export default TreeCard;
