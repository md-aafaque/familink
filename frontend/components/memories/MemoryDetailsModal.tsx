"use client";

import { Memory } from '@/lib/shared/schemas/memories';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { X, Calendar, Quote, ImageIcon, Users, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface MemoryDetailsModalProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryDetailsModal({ memory, isOpen, onClose }: MemoryDetailsModalProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Prevent scrolling when modal is open
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn("absolute inset-0 backdrop-blur-md", theme.isDark ? "bg-black/90" : "bg-slate-900/40")}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={onClose}
            className={cn(
                "relative w-full h-full flex flex-col overflow-hidden shadow-2xl md:rounded-3xl md:h-[90vh] md:w-[90vw] md:max-w-6xl md:border",
                theme.colors.bg,
                theme.colors.border
            )}
          >
            {/* Immersive Top Bar */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between border-b md:rounded-t-3xl backdrop-blur-xl",
                theme.isDark ? "bg-black/40 border-white/5" : "bg-white/60 border-black/5"
              )}
            >
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className={cn("p-2.5 rounded-full transition-all active:scale-90", theme.isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-900")}
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h2 className={cn("text-lg font-bold leading-tight", theme.colors.text)}>{memory.title}</h2>
                  <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", theme.colors.textMuted)}>
                    <span>{memory.type}</span>
                    <span className="opacity-30">•</span>
                    <span>{formatDate(memory.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {memory.imageUrl && (
                    <button 
                    onClick={() => window.open(memory.imageUrl, '_blank')}
                    className={cn("p-2.5 rounded-full transition-all", theme.isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-900")}
                    title={t('memoryDetails.openOriginal')}
                    >
                    <Download className="w-5 h-5" />
                    </button>
                )}
                <button className={cn("p-2.5 rounded-full transition-all", theme.isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-900")}>
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
              
              {/* Media/Content Section */}
              <div className={cn(
                "flex-1 relative flex items-center justify-center min-h-0 group overflow-y-auto",
                theme.isDark ? "bg-black/20" : "bg-slate-50/50"
              )}>
                {isPhoto || (isMilestone && memory.imageUrl) ? (
                  <div className="w-full h-full flex items-center justify-center p-4 md:p-12 mt-16">
                    <motion.img 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={memory.imageUrl} 
                        alt={memory.title} 
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full object-contain z-10 shadow-2xl rounded-lg cursor-default"
                    />
                  </div>
                ) : isStory ? (
                    <div className="w-full max-w-4xl mx-auto px-6 py-24 md:py-32">
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "p-8 md:p-16 rounded-3xl border shadow-xl cursor-default transition-colors",
                                theme.colors.surface,
                                theme.colors.border
                            )}
                        >
                            <div 
                                className={cn(
                                    "prose prose-lg max-w-none transition-colors",
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
                                    if (href) {
                                      window.open(href, '_blank', 'noopener,noreferrer');
                                    }
                                  }
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={cn("flex flex-col items-center gap-6 opacity-20", theme.colors.text)}>
                        <div className={cn("p-8 rounded-full", theme.isDark ? "bg-white/5" : "bg-black/5")}>
                            <ImageIcon className="w-16 h-16" />
                        </div>
                        <p className="text-2xl font-black uppercase tracking-[0.2em]">No Media Found</p>
                    </div>
                )}

                {/* Bottom Caption Overlay (WhatsApp style) */}
                {(isPhoto || (isMilestone && memory.imageUrl)) && memory.content && (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "absolute bottom-0 left-0 right-0 z-30 p-8 pt-20 flex flex-col items-center transition-colors",
                            theme.isDark 
                                ? "bg-gradient-to-t from-black via-black/80 to-transparent text-white" 
                                : "bg-gradient-to-t from-white via-white/80 to-transparent text-slate-900"
                        )}
                    >
                        <div className="w-full max-w-3xl text-center">
                            <p className="text-base md:text-lg leading-relaxed font-medium">
                                {memory.content}
                            </p>
                            
                            {memory.associatedPeople && memory.associatedPeople.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {memory.associatedPeople.map(p => (
                                        <span key={p.id} className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-colors",
                                            theme.colors.primaryMuted,
                                            theme.colors.accent,
                                            theme.colors.borderAccent
                                        )}>
                                            {p.firstName} {p.lastName}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
              </div>

              {/* Sidebar for Story/Milestone metadata */}
              {((isStory || isMilestone || isPhoto) && memory.associatedPeople && memory.associatedPeople.length > 0) && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "hidden lg:flex w-80 border-l flex-col p-8 pt-32 gap-8 transition-colors",
                        theme.colors.surface,
                        theme.colors.border
                    )}
                  >
                      <div className="space-y-6">
                          <h3 className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", theme.colors.text)}>
                            Tagged Family
                          </h3>
                          <div className="space-y-3">
                              {memory.associatedPeople.map(p => (
                                  <div key={p.id} className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all hover:scale-[1.02]",
                                    theme.colors.bg,
                                    theme.colors.border
                                  )}>
                                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase", theme.colors.primaryMuted, theme.colors.accent)}>
                                          {(p.firstName?.[0] || "") + (p.lastName?.[0] || "")}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className={cn("text-sm font-bold", theme.colors.text)}>{p.firstName} {p.lastName}</span>
                                        <span className={cn("text-[9px] font-black uppercase tracking-tighter opacity-40", theme.colors.text)}>Family Member</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
