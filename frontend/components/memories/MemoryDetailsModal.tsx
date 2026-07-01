"use client";

import { Memory } from '@/lib/shared/schemas/memories';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import SurfaceDecorations from '../shared/SurfaceDecorations';
import { useLanguage } from '../providers/LanguageProvider';
import { X, Calendar, Quote, ImageIcon, Users, Download, Share2, User } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MemoryDetailsModalProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryDetailsModal({ memory, isOpen, onClose }: MemoryDetailsModalProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!memory) return null;

  const isStory = memory.type === 'story';
  const isPhoto = memory.type === 'photo';
  const isMilestone = memory.type === 'milestone';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center pt-20 pb-8 px-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full h-full md:h-[85vh] md:w-[90vw] md:max-w-5xl flex flex-col overflow-hidden rounded-none md:rounded-[2.5rem] border-0 md:border-2 shadow-pop-lg",
              theme.colors.bg,
              theme.colors.border
            )}
          >
            <SurfaceDecorations density="light" />

            <div className={cn(
              "flex items-center justify-between px-6 py-4 md:px-8 md:py-6 border-b shrink-0",
              theme.colors.border,
              theme.colors.surface
            )}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0",
                    "text-muted-foreground"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-lg font-black leading-tight text-foreground truncate">
                    {memory.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{memory.type}</span>
                    <span className="opacity-30">·</span>
                    <span>{formatDate(memory.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {memory.imageUrl && (
                  <button
                    onClick={() => window.open(memory.imageUrl, '_blank')}
                    className={cn(
                      "p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5",
                      "text-muted-foreground"
                    )}
                    title={t('memoryDetails.openOriginal')}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button className={cn(
                  "p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5",
                  "text-muted-foreground"
                )}>
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className={cn(
                "flex-1 relative flex items-center justify-center overflow-y-auto",
                theme.isDark ? "bg-black/20" : "bg-slate-50/50"
              )}>
                {isPhoto || (isMilestone && memory.imageUrl) ? (
                  <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={memory.imageUrl}
                      alt={memory.title}
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-pop-lg"
                    />
                  </div>
                ) : isStory ? (
                  <div className="w-full max-w-3xl mx-auto px-6 py-16 md:py-24">
                    <div className={cn(
                      "p-8 md:p-12 rounded-[2.5rem] border-2 shadow-pop-lg",
                      theme.colors.surface,
                      theme.colors.border
                    )}>
                      <div
                        className={cn(
                          "prose prose-lg max-w-none",
                          theme.isDark ? "prose-invert" : "prose-slate",
                          "prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight",
                          "prose-p:leading-relaxed prose-p:text-base",
                          "prose-a:text-primary prose-a:font-bold",
                          "prose-strong:font-black",
                          "prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary"
                        )}
                        dangerouslySetInnerHTML={{ __html: memory.content || '' }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.tagName === 'A') {
                            e.preventDefault();
                            const href = target.getAttribute('href');
                            if (href) window.open(href, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                    <div className="p-8 rounded-full bg-black/5 dark:bg-white/5">
                      <ImageIcon className="w-16 h-16" />
                    </div>
                    <p className="text-2xl font-black uppercase tracking-[0.2em]">{t('memoryDetails.noMedia')}</p>
                  </div>
                )}
              </div>

              {memory.associatedPeople && memory.associatedPeople.length > 0 && (
                <div className={cn(
                  "md:w-72 shrink-0 border-t md:border-t-0 md:border-l p-6 md:p-8 flex flex-col gap-6",
                  theme.colors.surface,
                  theme.colors.border
                )}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    {t('memoryDetails.taggedFamily')}
                  </h3>
                  <div className="space-y-3">
                    {memory.associatedPeople.map(p => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/person/${p.id}`)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-pop-sm",
                          theme.colors.bg,
                          theme.colors.border
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase shrink-0",
                          theme.colors.primaryMuted,
                          theme.colors.accent
                        )}>
                          {(p.firstName?.[0] || "") + (p.lastName?.[0] || "")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/40">
                            {t('memoryDetails.familyMember')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isPhoto && memory.content && (
              <div className={cn(
                "px-6 py-4 md:px-8 md:py-5 border-t",
                theme.colors.border,
                theme.colors.surface
              )}>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {memory.content}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
