"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Edit3, Link2, Trash2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { useAppTheme } from "../providers/ThemeProvider";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: Array<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
}

export default function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const { theme } = useAppTheme();
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
            "fixed z-[70] min-w-[240px] backdrop-blur-xl border rounded-[2rem] shadow-2xl overflow-hidden p-3",
            theme.colors.surface,
            theme.colors.border
        )}
        style={{ left: x, top: y }}
      >
        <div className="space-y-1">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                item.variant === 'danger' 
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" 
                  : cn(theme.colors.textMuted, theme.colors.hover, "hover:" + theme.colors.text)
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                item.variant === 'danger' ? "bg-red-50 dark:bg-red-900/20" : cn(theme.colors.bg, "group-hover:" + theme.colors.surface)
              )}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
