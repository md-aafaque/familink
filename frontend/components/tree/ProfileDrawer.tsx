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
  placement?: "modal" | "panel";
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
  treeId,
  placement = "modal"
}: ProfileDrawerProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'facts' | 'family' | 'timeline'>('facts');
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

  // ── Shared content (used in both modal and panel modes) ──
  const birthYr = person.birthDate?.match(/\d{4}/)?.[0];
  const personIdStr = `ID: ${person.id.substring(0, 5)}`;
  const initials = `${person.firstName[0]}${person.lastName?.[0] ?? ""}`.toUpperCase();
  const isGhost = person.status === 'ghost';
  const isDead = !!person.deathDate;

  const drawerBody = (
    <>
      {/* Header — profile hero with family-themed decorative shapes */}
      <div className="relative min-h-[200px] px-5 pb-5 pt-14 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${isDead ? '#94a3b8' : '#F97316'}22, transparent 70%)`,
        }}>
        {/* Decorative elements — family-themed shapes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <circle cx="85%" cy="20%" r="18%" fill="#FBBF24" opacity="0.06" />
          <circle cx="15%" cy="80%" r="12%" fill="#F472B6" opacity="0.05" />
          <circle cx="60%" cy="10%" r="8%" fill="none" stroke="#F97316" strokeWidth="0.5" opacity="0.06" />
          {/* Family branch motif */}
          <path d="M 70% 15% Q 75% 8% 82% 12% M 82% 12% Q 88% 16% 85% 22%" fill="none" stroke="#FBBF24" strokeWidth="0.3" opacity="0.06" />
          <circle cx="82%" cy="12%" r="1.5%" fill="#FBBF24" opacity="0.04" />
          {/* Connection node cluster */}
          <circle cx="12%" cy="25%" r="2%" fill="none" stroke="#F472B6" strokeWidth="0.3" opacity="0.05" />
          <circle cx="12%" cy="25%" r="0.8%" fill="#F472B6" opacity="0.06" />
          <circle cx="16%" cy="22%" r="1.2%" fill="none" stroke="#F472B6" strokeWidth="0.2" opacity="0.04" />
          {/* Heritage ring */}
          <circle cx="78%" cy="78%" r="15%" fill="none" stroke="#34D399" strokeWidth="0.2" opacity="0.04" strokeDasharray="3 4" />
          <circle cx="78%" cy="78%" r="10%" fill="none" stroke="#34D399" strokeWidth="0.15" opacity="0.03" />
          {/* Tiny sparkles */}
          <circle cx="20%" cy="15%" r="1.5%" fill="#F97316" opacity="0.08" />
          <circle cx="75%" cy="10%" r="1%" fill="#FBBF24" opacity="0.06" />
          <polygon points="65%,18% 66%,14% 67%,18% 63%,17% 67%,17%" fill="#F97316" opacity="0.05" />
          <polygon points="30%,12% 31%,8% 32%,12% 28%,11% 32%,11%" fill="#F472B6" opacity="0.05" />
          <polygon points="35%,82% 35.4%,81% 35.8%,82% 34.6%,81.6% 35.4%,81.6%" fill="#FBBF24" opacity="0.05" />
          <polygon points="60%,85% 60.4%,84% 60.8%,85% 59.6%,84.6% 60.4%,84.6%" fill="#F97316" opacity="0.04" />
        </svg>

        <div className="relative z-10 flex gap-5 items-end">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-pop-lg flex-shrink-0 overflow-hidden"
            style={{
              background: isDead
                ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                : 'linear-gradient(135deg, #F97316, #FB923C)'
            }}>
            {person.imageUrl ? (
              <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h2 className="font-black text-xl truncate text-foreground">
              {person.firstName} {person.lastName}
            </h2>
            {person.nickname && (
              <p className="text-sm font-medium italic text-muted-foreground">
                "{person.nickname}"
              </p>
            )}
            <p className="text-[11px] font-bold tracking-tight text-muted-foreground mt-0.5">
              {birthYr ? `b.${birthYr}` : ''}{birthYr && personIdStr ? ' • ' : ''}{personIdStr}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-[#FFFDF5]/80 dark:bg-[#1E293B]/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors border border-muted-foreground/30"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ghost badge + delete */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-muted-foreground/30">
        <div className="flex items-center gap-2">
          {isGhost && (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
              {t('profileDrawer.ghost')}
            </span>
          )}
          {isDead && (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground">
              {t('profileDrawer.deceased')}
            </span>
          )}
          {person.status === 'active' && (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/50">
              {t('profileDrawer.verified')}
            </span>
          )}
        </div>
        {!isConfirmingDelete && (
          <button onClick={() => setIsConfirmingDelete(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title={isAdmin ? t('profileDrawer.deleteProfile') : t('profileDrawer.requestDeletion')}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="mx-5 my-3 p-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-black uppercase tracking-tight text-red-600 dark:text-red-400">
              {isAdmin ? t('profileDrawer.confirmDelete') : t('profileDrawer.proposeRemoval')}
            </p>
          </div>
          {!isAdmin && (
              <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('profileDrawer.deleteReason')}
                className="w-full p-3 rounded-xl border text-xs outline-none resize-none h-20 mb-3 focus:ring-2 focus:ring-red-500/20 bg-card border-muted-foreground/30 text-foreground" />
          )}
          <div className="flex items-center gap-2">
            <button disabled={isDeleting} onClick={async () => {
              setIsDeleting(true); try { await onDelete?.(person.id, deleteReason); } finally { setIsDeleting(false); setIsConfirmingDelete(false); setDeleteReason(""); }
            }} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />)}
              {isAdmin ? t('profileDrawer.deleteNow') : t('profileDrawer.submitRequest')}
            </button>
            <button disabled={isDeleting} onClick={() => { setIsConfirmingDelete(false); setDeleteReason(""); }}
              className="px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all border-muted-foreground/30 text-muted-foreground hover:bg-muted">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 px-5 py-4 border-b border-muted-foreground/30">
        <div className="flex gap-2 w-full">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold uppercase transition-all border-muted-foreground/30 text-muted-foreground hover:bg-primary/5 hover:border-primary/50 hover:text-primary">
            <ExternalLink className="w-3.5 h-3.5" />
            {t('profileDrawer.viewProfile')}
          </button>
          <button onClick={onProposeRelationship}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold uppercase transition-all border-muted-foreground/30 text-muted-foreground hover:bg-primary/5 hover:border-primary/50 hover:text-primary">
            <Link2 className="w-3.5 h-3.5" />
            {t('profileDrawer.link')}
          </button>
        </div>

        {isGhost && (isAdmin || (person.userPermission !== 'owner' && person.userPermission !== 'editor')) && !isConfirmingClaim && (
          <button disabled={isClaiming} onClick={() => setIsConfirmingClaim(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] border-2 border-slate-800 dark:border-black shadow-pop-sm">
            <Sparkles className="w-4 h-4" />
            {t('profileDrawer.claim')}
          </button>
        )}

        {isConfirmingClaim && (
          <div className="p-4 rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-black uppercase tracking-tight text-orange-600 dark:text-orange-400">
                {isAdmin ? t('profileDrawer.confirmLink') : t('profileDrawer.proposeClaim')}
              </p>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground mb-3">
              {isAdmin ? t('profileDrawer.adminClaimNote') : t('profileDrawer.userClaimNote')}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={isClaiming} onClick={handleClaim}
                className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isAdmin ? t('profileDrawer.confirmNow') : t('profileDrawer.submitRequest')}
              </button>
              <button disabled={isClaiming} onClick={() => setIsConfirmingClaim(false)}
                className="px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all border-muted-foreground/30 text-muted-foreground hover:bg-muted">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={cn(
            "p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
            statusMessage.type === 'success' ? "bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          )}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-5 py-3 border-b border-muted-foreground/30 bg-[#FFFDF5] dark:bg-[#1E293B]">
        {(['facts', 'family', 'timeline'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all",
              activeTab === tab
                ? "bg-orange-500 text-white shadow-pop-sm border-2 border-foreground"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}>
            {tab === 'facts' ? t('profileDrawer.tab.core') || 'Facts' : tab === 'family' ? t('profileDrawer.tab.family') : t('profileDrawer.tab.timeline')}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="p-5 space-y-6 bg-[#FFFDF5] dark:bg-[#1E293B] relative">
        {/* Subtle decorative dots in background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" aria-hidden="true">
          <circle cx="8%" cy="15%" r="0.6%" fill="#F97316" opacity="0.03" />
          <circle cx="92%" cy="25%" r="0.4%" fill="#FBBF24" opacity="0.03" />
          <circle cx="15%" cy="75%" r="0.5%" fill="#F472B6" opacity="0.03" />
          <circle cx="85%" cy="60%" r="0.7%" fill="#34D399" opacity="0.03" />
        </svg>
        {activeTab === 'facts' && (
          <div className="space-y-5">
            {/* Birth Information */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3 text-orange-500" />
                {t('profileDrawer.birthInfo')}
              </h3>
              <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F97316] to-[#FBBF24] opacity-40" />
                {person.birthDate ? (
                  <p className="text-sm font-bold text-foreground">{formatDate(person.birthDate)}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t('common.notProvided')}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-muted-foreground">
                {t('profileDrawer.gender')}
              </h3>
              <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card capitalize">
                <p className="text-sm font-bold text-foreground">
                  {person.gender || t('common.notSpecified')}
                </p>
              </div>
            </div>

            {/* Nickname */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-muted-foreground">
                {t('profileDrawer.nickname')}
              </h3>
              <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card">
                {person.nickname ? (
                  <p className="text-sm font-bold text-foreground">{person.nickname}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t('common.notProvided')}</p>
                )}
              </div>
            </div>

            {/* Education */}
            {(() => {
                const educations = typeof person.educations === 'string' ? JSON.parse(person.educations) : (Array.isArray(person.educations) ? person.educations : []);
                const visibleEntries = educations.filter((e: any) => e.visibility === 'tree');
                if (visibleEntries.length === 0 || person.educationSectionVisible === false) return null;
                const latest = [...visibleEntries].sort((a, b) => {
                    const dateA = a.endDate || a.startDate;
                    const dateB = b.endDate || b.startDate;
                    if (!dateA) return 1; if (!dateB) return -1; return dateB.localeCompare(dateA);
                })[0];
                const startYear = latest.startDate ? latest.startDate.split('-')[0] : '';
                const endYear = latest.endDate ? latest.endDate.split('-')[0] : 'Present';
                return (
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                            <GraduationCap className="w-3 h-3 text-orange-500" />
                            {t('profileDrawer.education')}
                        </h3>
                        <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card">
                            <p className="text-sm font-bold text-foreground">{latest.school}</p>
                            {latest.degree && <p className="text-xs font-medium text-muted-foreground">{latest.degree}</p>}
                            <p className="text-[10px] opacity-60 uppercase font-black text-muted-foreground">{startYear}{endYear ? ` - ${endYear}` : ''}</p>
                        </div>
                    </div>
                );
            })()}

            {/* Occupation */}
            {(() => {
                const occupations = typeof person.occupations === 'string' ? JSON.parse(person.occupations) : (Array.isArray(person.occupations) ? person.occupations : []);
                const visibleEntries = occupations.filter((o: any) => o.visibility === 'tree');
                if (visibleEntries.length === 0 || person.occupationSectionVisible === false) return null;
                const current = visibleEntries.find((o: any) => o.isCurrent);
                const latest = current || [...visibleEntries].sort((a, b) => {
                    const dateA = a.endDate || a.startDate;
                    const dateB = b.endDate || b.startDate;
                    if (!dateA) return 1; if (!dateB) return -1; return dateB.localeCompare(dateA);
                })[0];
                const startYear = latest.startDate ? latest.startDate.split('-')[0] : '';
                const endYear = latest.isCurrent ? 'Present' : (latest.endDate ? latest.endDate.split('-')[0] : '');
                return (
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="w-3 h-3 text-orange-500" />
                            {t('profileDrawer.occupation')}
                        </h3>
                        <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card">
                            <p className="text-sm font-bold text-foreground">{latest.title}</p>
                            <p className="text-xs font-medium text-muted-foreground">{latest.company}</p>
                            <p className="text-[10px] opacity-60 uppercase font-black text-muted-foreground">{startYear}{endYear ? ` - ${endYear}` : ''}</p>
                        </div>
                    </div>
                );
            })()}

            {/* Contact Information */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3 h-3 text-orange-500" />
                {t('profileDrawer.contactInfo')}
              </h3>
              <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card space-y-2">
                {person.email ? (
                  <div className="flex items-center gap-3"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{person.email}</span></div>
                ) : null}
                {person.phone ? (
                  <div className="flex items-center gap-3"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{person.phone}</span></div>
                ) : null}
                {!person.email && !person.phone && (
                  <p className="text-sm italic text-muted-foreground">{t('profileDrawer.noContactInfo')}</p>
                )}
              </div>
            </div>

            {person.deathDate && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-muted-foreground">
                  {t('profileDrawer.deathInfo')}
                </h3>
                <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card">
                  <p className="text-sm font-bold text-foreground">{formatDate(person.deathDate)}</p>
                </div>
              </div>
            )}
          </div>
        )}

                {activeTab === 'family' && (
                  <div className="space-y-6">
                    {person.relationships && person.relationships.length > 0 ? (
                      <>
                        {person.relationships.some((r: any) => r.type === 'parent') && (
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-muted-foreground">
                              <User className="w-3 h-3 text-orange-500" />
                              {t('profileDrawer.parents')}
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships.filter((r: any) => r.type === 'parent').map((rel: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl border-2 border-muted-foreground/30 text-sm font-bold text-foreground bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                                  {getPersonName(rel.targetId)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {person.relationships.some((r: any) => r.type === 'sibling') && (
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-muted-foreground">
                              <User className="w-3 h-3 text-primary" />
                              {t('profileDrawer.siblings')}
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships.filter((r: any) => r.type === 'sibling').map((rel: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl border-2 border-muted-foreground/30 text-sm font-bold text-foreground bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                                  {getPersonName(rel.targetId)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {person.relationships.some((r: any) => r.type === 'spouse') && (
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-muted-foreground">
                              <Heart className="w-3 h-3 text-pink-500" />
                              {t('profileDrawer.partners')}
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships.filter((r: any) => r.type === 'spouse').map((rel: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl border-2 border-muted-foreground/30 text-sm font-bold text-foreground bg-card hover:border-pink-400/50 hover:bg-pink-500/5 cursor-pointer transition-all">
                                  {getPersonName(rel.targetId)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {person.relationships.some((r: any) => r.type === 'child') && (
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-muted-foreground">
                              <User className="w-3 h-3 text-primary" />
                              {t('profileDrawer.children')}
                            </h3>
                            <div className="grid gap-2">
                              {person.relationships.filter((r: any) => r.type === 'child').map((rel: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl border-2 border-muted-foreground/30 text-sm font-bold text-foreground bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                                  {getPersonName(rel.targetId)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-10 rounded-2xl border-2 border-dashed border-muted-foreground/30 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {t('profileDrawer.noRelatives')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-6 relative pb-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {t('profileDrawer.lifeEvents')}
                      </h3>
                      <button onClick={() => setIsMemoryModalOpen(true)}
                        className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {memoriesLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    ) : memories && memories.length > 0 ? (
                      <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-muted-foreground/30">
                        {memories.map((m: any, idx: number) => (
                          <div key={m.id} className="relative pl-8 group">
                            <div className={cn(
                              "absolute left-[9px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-transform group-hover:scale-125 z-10",
                              "bg-card",
                              m.type === 'milestone' ? "border-amber-500" : (m.type === 'story' ? "border-orange-500" : "border-emerald-500")
                            )} />
                            <div className="p-4 rounded-2xl border-2 border-muted-foreground/30 bg-card hover:shadow-pop-sm transition-all">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {formatDate(m.date)}
                                </span>
                                <span className="p-1 rounded bg-muted/50 text-muted-foreground">
                                  {m.type === 'milestone' && <Calendar className="w-3 h-3" />}
                                  {m.type === 'story' && <Quote className="w-3 h-3" />}
                                  {m.type === 'photo' && <ImageIcon className="w-3 h-3" />}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-foreground mb-1">{m.title}</h4>
                              {m.imageUrl && <img src={m.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
                              {m.content && (
                                <div className="text-[10px] line-clamp-2 text-muted-foreground"
                                  dangerouslySetInnerHTML={m.type === 'story' ? { __html: m.content } : undefined}>
                                  {m.type !== 'story' ? m.content : null}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 rounded-2xl border-2 border-dashed border-muted-foreground/30 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {t('profileDrawer.noEvents')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
    </>
  );

  const memoryModal = (
    <MemoryModal
      treeId={treeId}
      isOpen={isMemoryModalOpen}
      onClose={() => setIsMemoryModalOpen(false)}
      initialPersonId={person.id}
    />
  );

  if (placement === "panel") {
    return (
      <div className="h-full flex flex-col overflow-y-auto">
        {drawerBody}
        {memoryModal}
      </div>
    );
  }

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
              {drawerBody}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {memoryModal}
    </>
  );
}
