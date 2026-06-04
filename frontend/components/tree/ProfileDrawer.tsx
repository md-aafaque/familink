"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Heart, Edit3, Link2, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";
import { useState } from "react";

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

  // Helper to get person name by id
  const getPersonName = (id: string) => {
    const p = peopleMap?.get(id);
    return p ? `${p.firstName} ${p.lastName ?? ""}`.trim() : id;
  };

  if (!person) return null;

  return (
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
                  <User className={cn("w-10 h-10", theme.colors.textMuted)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={cn("font-black text-2xl truncate", theme.colors.text)}>
                    {person.firstName} {person.lastName}
                  </h2>
                  {person.birthDate && (
                    <p className={cn("text-sm", theme.colors.textMuted)}>
                      b. {new Date(person.birthDate).toLocaleDateString()}
                    </p>
                  )}
                  {person.deathDate && (
                    <p className={cn("text-sm", theme.colors.textMuted)}>
                      d. {new Date(person.deathDate).toLocaleDateString()}
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
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs uppercase transition-colors",
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
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border font-bold text-xs uppercase transition-colors",
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
                      : cn("hover:bg-slate-200 dark:hover:bg-slate-700", theme.colors.textMuted)
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
                          {new Date(person.birthDate).toLocaleDateString()}
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
                          {new Date(person.deathDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'family' && (
                <div className="space-y-4">
                  {person.relationships && person.relationships.length > 0 ? (
                    <>
                      {/* Parents Section */}
                      {person.relationships.filter((r: any) => r.type === 'parent').length > 0 && (
                        <div>
                          <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                            <User className="w-3 h-3" />
                            Parents
                          </h3>
                          <div className="space-y-2">
                            {person.relationships
                              .filter((r: any) => r.type === 'parent')
                              .map((rel: any, idx: number) => (
                                <div key={idx} className={cn("p-2 rounded border text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700", theme.colors.border)}>
                                  {getPersonName(rel.targetId)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Siblings Section */}
                      {person.relationships.filter((r: any) => r.type === 'parent').length > 0 && (
                        <div>
                          <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                            <User className="w-3 h-3" />
                            Siblings
                          </h3>
                          <div className="space-y-2">
                            {(() => {
                              const parentIds = person.relationships
                                .filter((r: any) => r.type === 'parent')
                                .map((r: any) => r.targetId);
                              
                              const siblings = Array.from(peopleMap?.values() ?? []).filter(p => 
                                p.id !== person.id &&
                                p.relationships.some((rel: any) => rel.type === 'parent' && parentIds.includes(rel.targetId))
                              );

                              return siblings.length > 0 ? (
                                siblings.map((sibling: any) => (
                                  <div key={sibling.id} className={cn("p-2 rounded border text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700", theme.colors.border)}>
                                    {sibling.firstName} {sibling.lastName}
                                  </div>
                                ))
                              ) : (
                                <p className={cn("text-xs", theme.colors.textMuted)}>No siblings found</p>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Spouse Section */}
                      {person.relationships.filter((r: any) => r.type === 'spouse').length > 0 && (
                        <div>
                          <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                            <Heart className="w-3 h-3 text-rose-500" />
                            Spouse
                          </h3>
                          <div className="space-y-2">
                            {person.relationships
                              .filter((r: any) => r.type === 'spouse')
                              .map((rel: any, idx: number) => (
                                <div key={idx} className={cn("p-2 rounded border text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700", theme.colors.border)}>
                                  Married to {getPersonName(rel.targetId)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Children Section */}
                      <div>
                        <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                          <User className="w-3 h-3" />
                          Children
                        </h3>
                        <div className="space-y-2">
                          {(() => {
                            const children = Array.from(peopleMap?.values() ?? []).filter(p => 
                              p.relationships.some((rel: any) => rel.type === 'parent' && rel.targetId === person.id)
                            );

                            return children.length > 0 ? (
                              children.map((child: any) => (
                                <div key={child.id} className={cn("p-2 rounded border text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700", theme.colors.border)}>
                                  {child.firstName} {child.lastName}
                                </div>
                              ))
                            ) : (
                              <p className={cn("text-xs", theme.colors.textMuted)}>No children found</p>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={cn("p-4 rounded-lg border text-center text-sm", theme.colors.border)}>
                      <p className={cn("text-xs", theme.colors.textMuted)}>No family relationships recorded</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className={cn("p-4 rounded-lg border text-center", theme.colors.border)}>
                  <FileText className={cn("w-8 h-8 mx-auto mb-2", theme.colors.textMuted)} />
                  <p className={cn("text-xs", theme.colors.textMuted)}>
                    Life events and photos coming soon
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
