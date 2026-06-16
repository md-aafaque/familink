"use client";

import { Memory } from '@/lib/shared/schemas/memories';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import { Calendar, Quote, ImageIcon, MapPin, Users, MoreVertical, Trash2, Edit } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MemoryDetailsModal from './MemoryDetailsModal';

interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export default function MemoryCard({ memory, onEdit, onDelete, isOwner }: MemoryCardProps) {
  const { theme } = useAppTheme();
  const [showActions, setShowActions] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getTypeIcon = () => {
    switch (memory.type) {
      case 'milestone': return <Calendar className="w-4 h-4" />;
      case 'story': return <Quote className="w-4 h-4" />;
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsDetailsOpen(true)}
        className={cn(
          "group relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-xl cursor-pointer",
          theme.colors.surface,
          theme.colors.border
        )}
      >
        {/* Image Section */}
        {memory.imageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img 
              src={memory.imageUrl} 
              alt={memory.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "p-1.5 rounded-md",
                  theme.isDark ? "bg-slate-800" : "bg-slate-100",
                  theme.colors.accent
                )}>
                  {getTypeIcon()}
                </span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme.colors.textMuted)}>
                  {formatDate(memory.date)}
                </span>
              </div>
              <h3 className={cn("text-lg font-black leading-tight", theme.colors.text)}>
                {memory.title}
              </h3>
            </div>

            {isOwner && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className={cn("p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800", theme.colors.text)}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showActions && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className={cn(
                        "absolute right-0 mt-1 w-32 rounded-xl shadow-xl border z-10 p-1",
                        theme.colors.surface,
                        theme.colors.border
                      )}
                    >
                      <button 
                        onClick={() => { onEdit?.(memory); setShowActions(false); }}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors", "hover:bg-slate-100 dark:hover:bg-slate-800", theme.colors.text)}
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => { onDelete?.(memory.id); setShowActions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Body */}
          {memory.content && (
            <div 
              className={cn(
                "text-sm leading-relaxed line-clamp-3", 
                theme.colors.textMuted,
                memory.type === 'story' && "prose-sm dark:prose-invert"
              )}
              dangerouslySetInnerHTML={memory.type === 'story' ? { __html: memory.content } : undefined}
            >
              {memory.type !== 'story' ? memory.content : null}
            </div>
          )}

          {/* Associated People */}
          {memory.associatedPeople && memory.associatedPeople.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-dashed" style={{ borderColor: theme.colors.border }}>
              <Users className={cn("w-3.5 h-3.5 opacity-40", theme.colors.text)} />
              {memory.associatedPeople.map(p => (
                <span key={p.id} className={cn("text-[10px] font-bold", theme.colors.accent)}>
                  {p.firstName} {p.lastName}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <MemoryDetailsModal 
        memory={memory} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </>
  );
}
