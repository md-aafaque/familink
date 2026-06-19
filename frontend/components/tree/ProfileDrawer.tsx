"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Heart, Edit3, Link2, FileText, Plus, Calendar, Quote, ImageIcon, Loader2, Briefcase, GraduationCap, Mail, Phone, MapPin, Trash2, AlertTriangle, ExternalLink, CheckCircle2, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import MemoryModal from "../memories/MemoryModal";

interface ProfileDrawerProps {
  person: any;
  peopleMap?: Map<string, any>;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: string, reason?: string) => Promise<void>;
  userRole?: string;
  onProposeRelationship?: () => void;
  treeId: string;
}

export default function ProfileDrawer({
  person,
  peopleMap,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  userRole,
  onProposeRelationship,
  treeId
}: ProfileDrawerProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'core' | 'family' | 'timeline'>('core');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClaim, setIsConfirmingClaim] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const isAdmin = userRole === 'admin';

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

  const handleClaim = async () => {
    setIsClaiming(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/trees/${treeId}/people/${person.id}/claim`);
      setStatusMessage({ 
        text: (res as any).message || t('profileDrawer.status.claimSubmitted'), 
        type: 'success' 
      });
      setIsConfirmingClaim(false);
      queryClient.invalidateQueries({ queryKey: ["tree-visual", treeId] });
    } catch (err) {
      setStatusMessage({ text: t('profileDrawer.status.claimFailed'), type: 'error' });
    } finally {
      setIsClaiming(false);
    }
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
                        b. {formatDate(person.birthDate)}
                      </p>
                    )}
                    {person.deathDate && (
                      <p className={cn("text-sm", theme.colors.textMuted)}>
                        d. {formatDate(person.deathDate)}
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

              {/* Status Badges & Actions */}
              <div className="flex flex-col gap-4 p-4 border-b border-b-slate-200 dark:border-b-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {person.status === 'active' && (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        theme.colors.primaryMuted,
                        theme.colors.accent
                      )}>
                        {t('profileDrawer.verified')}
                      </span>
                    )}
                    {person.status === 'ghost' && (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                        theme.isDark ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-300"
                      )}>
                        {t('profileDrawer.ghost')}
                      </span>
                    )}
                    {person.deathDate && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                        {t('profileDrawer.deceased')}
                      </span>
                    )}
                  </div>

                  {!isConfirmingDelete && (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className={cn(
                        "p-2 rounded-lg transition-colors group relative",
                        theme.isDark ? "hover:bg-red-500/10 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                      )}
                      title={isAdmin ? t('profileDrawer.deleteProfile') : t('profileDrawer.requestDeletion')}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {isConfirmingDelete && (
                  <div className={cn(
                    "flex flex-col gap-3 p-4 rounded-2xl border animate-in zoom-in-95 duration-200",
                    theme.isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-100"
                  )}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className={cn("text-xs font-black uppercase tracking-tight", theme.isDark ? "text-red-400" : "text-red-600")}>
                        {isAdmin ? t('profileDrawer.confirmDelete') : t('profileDrawer.proposeRemoval')}
                      </p>
                    </div>
                    
                    {!isAdmin && (
                      <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder={t('profileDrawer.deleteReason')}
                        className={cn(
                          "w-full p-3 rounded-xl border text-xs outline-none resize-none h-20 transition-all focus:ring-2 focus:ring-red-500/20",
                          theme.colors.bg,
                          theme.colors.border,
                          theme.colors.text
                        )}
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isDeleting}
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await onDelete?.(person.id, deleteReason);
                          } finally {
                            setIsDeleting(false);
                            setIsConfirmingDelete(false);
                            setDeleteReason("");
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />)}
                        {isAdmin ? t('profileDrawer.deleteNow') : t('profileDrawer.submitRequest')}
                      </button>
                      <button
                        disabled={isDeleting}
                        onClick={() => {
                          setIsConfirmingDelete(false);
                          setDeleteReason("");
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          theme.colors.border,
                          theme.colors.text,
                          "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 px-4 py-3 border-b border-b-slate-200 dark:border-b-slate-800">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={onEdit}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs uppercase transition-all shadow-sm",
                      theme.colors.primaryMuted, theme.colors.accent, "hover:opacity-80"
                    )}
                    title={t('profileDrawer.viewDetailedProfile')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('profileDrawer.viewProfile')}
                  </button>
                  <button
                    onClick={onProposeRelationship}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-bold text-xs uppercase transition-colors shadow-sm",
                      theme.colors.primaryMuted, theme.colors.accent, "hover:opacity-80"
                    )}
                    title={t('profileDrawer.linkFamily')}
                  >
                    <Link2 className="w-4 h-4" />
                    {t('profileDrawer.link')}
                  </button>
                </div>

                {person.status === 'ghost' && (isAdmin || (person.userPermission !== 'owner' && person.userPermission !== 'editor')) && !isConfirmingClaim && (
                  <button
                    disabled={isClaiming}
                    onClick={() => setIsConfirmingClaim(true)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg",
                      theme.colors.primary,
                      "text-white hover:opacity-90 active:scale-[0.98]"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('profileDrawer.claim')}
                  </button>
                )}

                {isConfirmingClaim && (
                  <div className={cn(
                    "flex flex-col gap-3 p-4 rounded-2xl border animate-in zoom-in-95 duration-200 mt-2",
                    theme.isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-orange-50 border-orange-100"
                  )}>
                    <div className="flex items-center gap-2">
                      <UserPlus className={cn("w-4 h-4", theme.colors.accent)} />
                      <p className={cn("text-xs font-black uppercase tracking-tight", theme.colors.accent)}>
                        {isAdmin ? t('profileDrawer.confirmLink') : t('profileDrawer.proposeClaim')}
                      </p>
                    </div>
                    
                    <p className={cn("text-[10px] font-medium leading-relaxed", theme.colors.textMuted)}>
                      {isAdmin 
                        ? t('profileDrawer.adminClaimNote')
                        : t('profileDrawer.userClaimNote')}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isClaiming}
                        onClick={handleClaim}
                        className={cn(
                          "flex-1 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg",
                          theme.colors.primary,
                          "hover:opacity-90 active:scale-[0.95]"
                        )}
                      >
                        {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isAdmin ? t('profileDrawer.confirmNow') : t('profileDrawer.submitRequest')}
                      </button>
                      <button
                        disabled={isClaiming}
                        onClick={() => setIsConfirmingClaim(false)}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          theme.colors.border,
                          theme.colors.text,
                          "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {statusMessage && (
                  <div className={cn(
                    "mt-2 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                    statusMessage.type === 'success' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                  )}>
                    {statusMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {statusMessage.text}
                  </div>
                )}
              </div>

              {/* Tab Navigation */ }
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
                    {tab === 'core' ? t('profileDrawer.tab.core') : tab === 'family' ? t('profileDrawer.tab.family') : t('profileDrawer.tab.timeline')}
                  </button>
                ))}
              </div>

              {/* Content Sections */}
              <div className="p-4 space-y-6">
                {activeTab === 'core' && (
                  <div className="space-y-4">
                    {/* 1. Birth Information */}
                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                        <Calendar className="w-3 h-3" />
                        {t('profileDrawer.birthInfo')}
                      </h3>
                      <div className={cn("p-3 rounded-lg border", theme.colors.border)}>
                        {person.birthDate ? (
                          <p className={cn("text-sm", theme.colors.text)}>
                            {formatDate(person.birthDate)}
                          </p>
                        ) : (
                          <p className={cn("text-sm italic opacity-50", theme.colors.textMuted)}>{t('common.notProvided')}</p>
                        )}
                      </div>
                    </div>

                    {/* 1b. Gender (New Position) */}
                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                        {t('profileDrawer.gender')}
                      </h3>
                      <div className={cn("p-3 rounded-lg border capitalize transition-colors", theme.colors.border)}>
                        <p className={cn("text-sm font-bold", theme.colors.text)}>
                          {person.gender || t('common.notSpecified')}
                        </p>
                      </div>
                    </div>

                    {/* 2. Education */}
                    {(() => {
                        const educations = typeof person.educations === 'string' ? JSON.parse(person.educations) : (Array.isArray(person.educations) ? person.educations : []);
                        const visibleEntries = educations.filter((e: any) => e.visibility === 'tree');
                        
                        if (visibleEntries.length === 0 || person.educationSectionVisible === false) return null;

                        const latest = [...visibleEntries].sort((a, b) => {
                            const dateA = a.endDate || a.startDate;
                            const dateB = b.endDate || b.startDate;
                            if (!dateA) return 1;
                            if (!dateB) return -1;
                            return dateB.localeCompare(dateA);
                        })[0];
                        
                        const startYear = latest.startDate ? latest.startDate.split('-')[0] : '';
                        const endYear = latest.endDate ? latest.endDate.split('-')[0] : 'Present';

                        return (
                            <div>
                                <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center justify-between gap-2", theme.colors.textMuted)}>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className={cn("w-3.5 h-3.5", theme.isDark ? "text-indigo-400" : "text-slate-400")} />
                                        {t('profileDrawer.education')}
                                    </div>
                                </h3>
                                <div className={cn("p-3 rounded-lg border transition-colors", theme.colors.border)}>
                                    <div className="space-y-1">
                                        <p className={cn("text-sm font-black leading-tight", theme.colors.text)}>{latest.school}</p>
                                        {latest.degree && <p className={cn("text-xs font-medium", theme.isDark ? "text-slate-300" : "text-slate-600")}>{latest.degree}</p>}
                                        <p className={cn("text-[10px] opacity-60 uppercase font-black", theme.colors.textMuted)}>
                                        {startYear}{endYear ? ` - ${endYear}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 3. Occupation */}
                    {(() => {
                        const occupations = typeof person.occupations === 'string' ? JSON.parse(person.occupations) : (Array.isArray(person.occupations) ? person.occupations : []);
                        const visibleEntries = occupations.filter((o: any) => o.visibility === 'tree');
                        
                        if (visibleEntries.length === 0 || person.occupationSectionVisible === false) return null;

                        const current = visibleEntries.find((o: any) => o.isCurrent);
                        const latest = current || [...visibleEntries].sort((a, b) => {
                            const dateA = a.endDate || a.startDate;
                            const dateB = b.endDate || b.startDate;
                            if (!dateA) return 1;
                            if (!dateB) return -1;
                            return dateB.localeCompare(dateA);
                        })[0];

                        const startYear = latest.startDate ? latest.startDate.split('-')[0] : '';
                        const endYear = latest.isCurrent ? 'Present' : (latest.endDate ? latest.endDate.split('-')[0] : '');

                        return (
                            <div>
                                <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center justify-between gap-2", theme.colors.textMuted)}>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className={cn("w-3.5 h-3.5", theme.isDark ? "text-indigo-400" : "text-slate-400")} />
                                        {t('profileDrawer.occupation')}
                                    </div>
                                </h3>
                                <div className={cn("p-3 rounded-lg border transition-colors", theme.colors.border)}>
                                    <div className="space-y-1">
                                        <p className={cn("text-sm font-black leading-tight", theme.colors.text)}>{latest.title}</p>
                                        <p className={cn("text-xs font-medium", theme.isDark ? "text-slate-300" : "text-slate-600")}>{latest.company}</p>
                                        <p className={cn("text-[10px] opacity-60 uppercase font-black", theme.colors.textMuted)}>
                                        {startYear}{endYear ? ` - ${endYear}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 4. Contact Information */}
                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme.colors.textMuted)}>
                        <Mail className="w-3 h-3" />
                        {t('profileDrawer.contactInfo')}
                      </h3>
                      <div className={cn("p-3 rounded-lg border space-y-3", theme.colors.border)}>
                        {person.email && (
                            <div className="flex items-center gap-3">
                                <Mail className={cn("w-3.5 h-3.5 opacity-40", theme.colors.text)} />
                                <span className={cn("text-xs font-medium truncate", theme.colors.text)}>{person.email}</span>
                            </div>
                        )}
                        {person.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className={cn("w-3.5 h-3.5 opacity-40", theme.colors.text)} />
                                <span className={cn("text-xs font-medium", theme.colors.text)}>{person.phone}</span>
                            </div>
                        )}
                        {!person.email && !person.phone && (
                            <p className={cn("text-sm italic opacity-50", theme.colors.textMuted)}>{t('profileDrawer.noContactInfo')}</p>
                        )}
                      </div>
                    </div>

                    {person.deathDate && (
                      <div>
                        <h3 className={cn("text-xs font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                          {t('profileDrawer.deathInfo')}
                        </h3>
                        <div className={cn("p-3 rounded-lg border", theme.colors.border)}>
                          <p className={cn("text-sm", theme.colors.text)}>
                            {formatDate(person.deathDate)}
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
                              {t('profileDrawer.parents')}
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
                              {t('profileDrawer.siblings')}
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
                              {t('profileDrawer.partners')}
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
                              {t('profileDrawer.children')}
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
                          {t('profileDrawer.noRelatives')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-6 relative pb-10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme.colors.textMuted)}>
                            {t('profileDrawer.lifeEvents')}
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
                                                {formatDate(m.date)}
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
                                {t('profileDrawer.noEvents')}
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
