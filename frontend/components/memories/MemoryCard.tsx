"use client";

import { Memory } from '@/lib/shared/schemas/memories';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { Calendar, Quote, ImageIcon, Users, MoreVertical, Trash2, Edit, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MemoryDetailsModal from './MemoryDetailsModal';

interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export default function MemoryCard({ memory, onEdit, onDelete, isOwner }: MemoryCardProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getTypeIcon = () => {
    switch (memory.type) {
      case 'milestone': return <Calendar className="w-4 h-4" />;
      case 'story': return <Quote className="w-4 h-4" />;
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeLabel = () => {
    switch (memory.type) {
      case 'milestone': return 'Milestone';
      case 'story': return 'Story';
      case 'photo': return 'Photo';
      default: return '';
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => setIsDetailsOpen(true)}
        className={cn(
          "group relative flex flex-col rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden shadow-pop-lg hover:shadow-pop-lg",
          theme.colors.surface,
          theme.colors.border,
        )}
      >
        {memory.imageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="flex-1 flex flex-col p-6 gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "p-1.5 rounded-lg",
                  theme.isDark ? "bg-slate-800" : "bg-[#FFFDF5]",
                  "border-2",
                  theme.colors.border
                )}>
                  {getTypeIcon()}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {getTypeLabel()}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {formatDate(memory.date)}
                </span>
              </div>
              <h3 className="text-lg font-black leading-tight text-foreground truncate">
                {memory.title}
              </h3>
            </div>

            {isOwner && (
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowActions(!showActions)}
                  className={cn(
                    "p-2 rounded-xl transition-all border-2 opacity-0 group-hover:opacity-100",
                    theme.colors.border,
                    "hover:bg-black/5 dark:hover:bg-white/5",
                    "text-muted-foreground"
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showActions && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn(
                        "absolute right-0 top-full mt-2 w-36 rounded-xl border-2 shadow-pop-lg z-40 p-1.5",
                        theme.colors.surface,
                        theme.colors.border
                      )}
                    >
                      <button
                        onClick={() => { onEdit?.(memory); setShowActions(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {t('memoryCard.edit')}
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('memoryCard.delete')}
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>

          {memory.content && (
            <div
              className={cn(
                "text-sm leading-relaxed line-clamp-3 text-muted-foreground",
                memory.type === 'story' && "prose-sm dark:prose-invert max-w-none"
              )}
              dangerouslySetInnerHTML={memory.type === 'story' ? { __html: memory.content } : undefined}
            >
              {memory.type !== 'story' ? memory.content : null}
            </div>
          )}

          {memory.associatedPeople && memory.associatedPeople.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t-2 border-dashed" style={{ borderColor: theme.colors.border }}>
              <Users className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {memory.associatedPeople.slice(0, 3).map(p => (
                  <span key={p.id} className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {p.firstName} {p.lastName}
                  </span>
                ))}
                {memory.associatedPeople.length > 3 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    +{memory.associatedPeople.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/person/${memory.posterId}`);
            }}
            className={cn(
              "p-2.5 rounded-xl shadow-pop-sm border-2 transition-all hover:scale-110 active:scale-90",
              theme.colors.surface,
              theme.colors.border,
              "text-muted-foreground hover:text-primary"
            )}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-sm rounded-[2.5rem] border-2 shadow-pop-lg overflow-hidden p-8 text-center",
              theme.colors.surface,
              theme.colors.border
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">
              {t('memoryCard.confirmDelete.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t('memoryCard.confirmDelete.desc')}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onDelete?.(memory.id); setShowDeleteConfirm(false); }}
                className="w-full py-3.5 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest border-2 border-foreground shadow-[3px_3px_0px_#1E293B] hover:shadow-[5px_5px_0px_#1E293B] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                {t('memoryCard.confirmDelete.confirm')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-foreground border-2 border-border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <MemoryDetailsModal
        memory={memory}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
}
