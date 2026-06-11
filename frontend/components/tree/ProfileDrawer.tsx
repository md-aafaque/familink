"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Heart, Edit3, Link2, FileText, Plus, Calendar, Quote, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import MemoryModal from "../memories/MemoryModal";

interface ProfileDrawerProps {
  person: any;
  peopleMap?: Map<string, any>;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onProposeRelationship?: () => void;
  treeId: string;
}

export default function ProfileDrawer({
  person,
  peopleMap,
  isOpen,
  onClose,
  onEdit,
  onProposeRelationship,
  treeId
}: ProfileDrawerProps) {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'core' | 'family' | 'timeline'>('core');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  // Fetch personal memories
  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['person-memories', treeId, person?.id],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/people/${person.id}/memories`);
      return (res as any).data;
    },
    enabled: !!person?.id && activeTab === 'timeline',
  });

  // Helper to get person name by id
  const getPersonName = (id: string) => {
    const p = peopleMap?.get(id);
    return p ? `${p.firstName} ${p.lastName ?? ""}`.trim() : id;
  };

  if (!person) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed right-0 top-0 h-full w-96 shadow-2xl border-l z-50 overflow-y-auto",
                theme.colors.surface,
                theme.colors.border
              )}
            >
              {/* Header */}
              <div className={cn("relative h-40 flex items-end p-6 border-b", theme.colors.border)}>
                <div className="flex gap-4 items-end w-full">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center border-4",
                    theme.colors.bg
                  )}>
                    {person.imageUrl ? (
                      <img src={person.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <User className={cn("w-10 h-10", theme.colors.textMuted)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={cn("font-black text-2xl truncate", theme.colors.text)}>
                      {person.firstName} {person.lastName}
                    </h2>
                    {person.birthDate && (
                      <p className={cn("text-sm", theme.colors.textMuted)}>
                        b. {format(new Date(person.birthDate), 'MMM d, yyyy')}
                      </p>
                    )}
                    {person.deathDate && (
                      <p className={cn("text-sm", theme.colors.textMuted)}>
                        d. {format(new Date(person.deathDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    "absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
                    theme.colors.text
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 p-4">
                {person.status === 'active' && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    theme.colors.primaryMuted,
                    theme.colors.accent
                  )}>
                    Verified
                  </span>
                )}
                {person.status === 'ghost' && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                    theme.isDark ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-300"
                  )}>
                    Ghost Profile
                  </span>
                )}
                {person.deathDate && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                    Deceased
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 px-4 py-3 border-b" style={{ borderColor: theme.colors.border }}>
                <button
                  onClick={onEdit}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs uppercase transition-colors",
                    theme.colors.primaryMuted,
                    theme.colors.accent,
                    "hover:opacity-80"
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={onProposeRelationship}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-bold text-xs uppercase transition-colors",
                    "border-rose-400 text-rose-500 hover:bg-rose-400/10"
                  )}
                >
                  <Link2 className="w-4 h-4" />
                  Link
                </button>
              </div>

              {/* Tab Navigation */}
              <div className={cn("flex gap-1 p-4 border-b", theme.colors.border)}>
                {(['core', 'family', 'timeline'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors",
                      activeTab === tab
                        ? cn(theme.colors.primaryMuted, theme.colors.accent)
                        : cn(theme.colors.hover, theme.colors.textMuted)
                    )}
                  >
                    {tab === 'core' ? 'Facts' : tab === 'family' ? 'Family' : 'Timeline'}
                  </button>
                ))}
              </div>

              {/* Content Sections */}
              <div className="p-4 space-y-6">
                {activeTab === 'core' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                        Birth Information
                      </h3>
                      <div className={cn("p-3 rounded-lg border", theme.colors.border)}>
                        {person.birthDate ? (
                          <p className={cn("text-sm", theme.colors.text)}>
                            {format(new Date(person.birthDate), 'MMMM d, yyyy')}
                          </p>
                        ) : (
                          <p className={cn("text-sm italic", theme.colors.textMuted)}>Not provided</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                        Gender
                      </h3>
                      <div className={cn("p-3 rounded-lg border capitalize", theme.colors.border)}>
                        <p className={cn("text-sm", theme.colors.text)}>
                          {person.gender || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {person.deathDate && (
                      <div>
                        <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                          Death Information
                        </h3>
                        <div className={cn("p-3 rounded-lg border", theme.colors.border)}>
                          <p className={cn("text-sm", theme.colors.text)}>
                            {format(new Date(person.deathDate), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'family' && (
                  <div className="space-y-6">
                    {person.relationships && person.relationships.length > 0 ? (
                      <>
                        {/* Parents Section */}
                        {person.relationships.some((r: any) => r.type === 'parent') && (
                          <div>
                            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2", theme.colors.textMuted)}>
                              <User className="w-3 h-3" />
                              Parents
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships
                                .filter((r: any) => r.type === 'parent')
                                .map((rel: any, idx: number) => (
                                  <div key={idx} 
                                       className={cn("p-3 rounded-xl border text-sm font-bold transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer", theme.colors.border, theme.colors.text)}>
                                    {getPersonName(rel.targetId)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Siblings Section */}
                        {person.relationships.some((r: any) => r.type === 'sibling') && (
                          <div>
                            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2", theme.colors.textMuted)}>
                              <User className="w-3 h-3" />
                              Siblings
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships
                                .filter((r: any) => r.type === 'sibling')
                                .map((rel: any, idx: number) => (
                                  <div key={idx} 
                                       className={cn("p-3 rounded-xl border text-sm font-bold transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer", theme.colors.border, theme.colors.text)}>
                                    {getPersonName(rel.targetId)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Spouse Section */}
                        {person.relationships.some((r: any) => r.type === 'spouse') && (
                          <div>
                            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2", theme.colors.textMuted)}>
                              <Heart className="w-3 h-3 text-rose-500" />
                              Partners
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships
                                .filter((r: any) => r.type === 'spouse')
                                .map((rel: any, idx: number) => (
                                  <div key={idx} className={cn("p-3 rounded-xl border text-sm font-bold transition-all hover:border-rose-400/50 hover:bg-rose-400/5 cursor-pointer", theme.colors.border, theme.colors.text)}>
                                    {getPersonName(rel.targetId)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Children Section */}
                        {person.relationships.some((r: any) => r.type === 'child') && (
                          <div>
                            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2", theme.colors.textMuted)}>
                              <User className="w-3 h-3" />
                              Children
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships
                                .filter((r: any) => r.type === 'child')
                                .map((rel: any, idx: number) => (
                                  <div key={idx} className={cn("p-3 rounded-xl border text-sm font-bold transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer", theme.colors.border, theme.colors.text)}>
                                    {getPersonName(rel.targetId)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={cn("p-8 rounded-[2rem] border border-dashed text-center", theme.colors.border)}>
                        <p className={cn("text-xs font-bold uppercase tracking-widest opacity-40", theme.colors.textMuted)}>
                          No relatives found
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-6 relative pb-10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme.colors.textMuted)}>
                            Life Events
                        </h3>
                        <button 
                            onClick={() => setIsMemoryModalOpen(true)}
                            className={cn("p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", theme.colors.accent)}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {memoriesLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className={cn("w-6 h-6 animate-spin", theme.colors.accent)} />
                        </div>
                    ) : memories && memories.length > 0 ? (
                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                            {memories.map((m: any, idx: number) => (
                                <div key={m.id} className="relative pl-8 group">
                                    <div className={cn(
                                        "absolute left-[9px] top-1.5 w-2 h-2 rounded-full border-2 transition-transform group-hover:scale-125 z-10",
                                        theme.colors.bg,
                                        m.type === 'milestone' ? "border-amber-500" : (m.type === 'story' ? "border-primary" : "border-emerald-500")
                                    )} />
                                    
                                    <div className={cn("p-3 rounded-xl border transition-all hover:shadow-md", theme.colors.surface, theme.colors.border)}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={cn("text-[9px] font-bold uppercase tracking-widest", theme.colors.textMuted)}>
                                                {format(new Date(m.date), 'MMM d, yyyy')}
                                            </span>
                                            <span className={cn("p-1 rounded bg-slate-100 dark:bg-slate-800", theme.colors.textMuted)}>
                                                {m.type === 'milestone' && <Calendar className="w-3 h-3" />}
                                                {m.type === 'story' && <Quote className="w-3 h-3" />}
                                                {m.type === 'photo' && <ImageIcon className="w-3 h-3" />}
                                            </span>
                                        </div>
                                        <h4 className={cn("text-xs font-bold mb-1", theme.colors.text)}>{m.title}</h4>
                                        {m.imageUrl && (
                                            <img src={m.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                                        )}
                                        {m.content && (
                                            <div 
                                                className={cn("text-[10px] line-clamp-2", theme.colors.textMuted)}
                                                dangerouslySetInnerHTML={m.type === 'story' ? { __html: m.content } : undefined}
                                            >
                                                {m.type !== 'story' ? m.content : null}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={cn("p-8 rounded-[2rem] border border-dashed text-center", theme.colors.border)}>
                            <FileText className={cn("w-8 h-8 mx-auto mb-2 opacity-20", theme.colors.text)} />
                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", theme.colors.textMuted)}>
                                No events recorded
                            </p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MemoryModal
        treeId={treeId}
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        initialPersonId={person.id}
      />
    </>
  );
}
