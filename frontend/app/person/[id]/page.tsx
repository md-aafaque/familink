"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import DataState from "../../../components/shared/DataState";
import PersonForm from "../../../components/PersonForm";
import { 
  ArrowLeft, 
  Trash2, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar,
  ShieldAlert,
  Sparkles,
  GitMerge,
  Link2,
  Briefcase,
  GraduationCap,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dateUtils";
import MergeProfileModal from "@/components/MergeProfileModal";
import PersonPermissionsTab from "@/components/PersonPermissionsTab";
import { Person } from "@/lib/shared/schemas/people";

import { useAppTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function PersonProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "permissions">("about");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClaim, setIsConfirmingClaim] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const { data, isLoading, isError, error } = useQuery<Person>({
    queryKey: ["person", id],
    queryFn: async () => {
      const res = await api.get<any, ApiResponse<Person>>(`/people/${id}/global`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: tree } = useQuery({
    queryKey: ["tree", data?.treeId],
    queryFn: async () => (await api.get(`/trees/${data?.treeId}`)).data as any,
    enabled: !!data?.treeId,
  });

  const { data: suggestions } = useQuery<any>({
    queryKey: ["person-suggestions", id, data?.treeId],
    queryFn: async () => {
      const res = await api.get<any, ApiResponse<any>>(`/trees/${data?.treeId}/people/${id}/suggestions`);
      return res.data;
    },
    enabled: !!id && !!data?.treeId,
  });

  const isAdmin = tree?.role === 'admin';

  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      const res = await api.patch(`/trees/${data?.treeId}/people/${id}`, input);
      return (res as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", id] });
      setIsEditing(false);
      setStatusMessage({ text: t('personPage.status.updated'), type: 'success' });
    },
    onError: () => {
        setStatusMessage({ text: t('personPage.status.updateFailed'), type: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isAdmin) {
        await api.delete(`/trees/${data?.treeId}/people/${id}`);
      } else {
        await api.post(`/trees/${data?.treeId}/people/${id}/propose-deletion`, { reason: deleteReason });
      }
    },
    onSuccess: () => {
      if (isAdmin) {
        router.back();
      } else {
        setIsConfirmingDelete(false);
        setDeleteReason("");
        setStatusMessage({ text: t('personPage.status.deletionProposed'), type: 'success' });
        queryClient.invalidateQueries({ queryKey: ["person", id] });
      }
    },
    onError: () => {
        setStatusMessage({ text: t('personPage.status.deletionFailed'), type: 'error' });
    }
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/trees/${data?.treeId}/people/${id}/claim`);
      return res as any;
    },
    onSuccess: (res) => {
      setStatusMessage({ text: (res as any)?.message || t('personPage.status.claimSubmitted'), type: 'success' });
      setIsConfirmingClaim(false);
      queryClient.invalidateQueries({ queryKey: ["person", id] });
      queryClient.invalidateQueries({ queryKey: ["tree-visual", data?.treeId] });
    },
    onError: () => {
        setStatusMessage({ text: t('personPage.status.claimFailed'), type: 'error' });
    }
  });

  // Auto-hide status messages after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 transition-colors duration-500 pb-20 px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className={cn("flex items-center gap-2 transition-colors group", theme.colors.textMuted, "hover:" + theme.colors.text)}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t('common.back')}
        </button>

        <div className="flex items-center gap-4">
          {!isEditing && (
            <>
              {data?.status === 'ghost' && data.userPermission !== 'owner' && !isConfirmingClaim && (
                <button
                  onClick={() => setIsConfirmingClaim(true)}
                  className={cn("px-6 py-2.5 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/10", theme.colors.primary)}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('personPage.claimProfile')}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                disabled={data?.userPermission !== 'owner' && data?.userPermission !== 'editor'}
                className={cn(
                    "px-6 py-2.5 border rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                    data?.userPermission === 'owner' || data?.userPermission === 'editor'
                        ? cn(theme.colors.surface, theme.colors.border, theme.colors.text, "hover:opacity-80 shadow-sm")
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-transparent opacity-50"
                )}
                title={data?.userPermission === 'owner' || data?.userPermission === 'editor' ? t('personPage.editProfile') : t('personPage.noEditPermission')}
              >
                {t('common.edit')}
              </button>
              
              {!isConfirmingDelete && (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className={cn(
                      "p-3 rounded-2xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                  title={isAdmin ? t('personPage.deleteProfile') : t('personPage.requestRemoval')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className={cn("px-6 py-2.5 text-sm font-black uppercase tracking-widest", theme.colors.textMuted)}
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {statusMessage && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
          >
            <div className={cn(
              "p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-4",
              statusMessage.type === 'success' ? "bg-white dark:bg-slate-900 border-green-500/20 shadow-green-500/10" : "bg-white dark:bg-slate-900 border-red-500/20 shadow-red-500/10"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-xl",
                    statusMessage.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}>
                    {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <p className={cn("text-sm font-bold", theme.colors.text)}>{statusMessage.text}</p>
              </div>
              <button onClick={() => setStatusMessage(null)} className={cn("p-1 hover:bg-black/5 rounded-lg", theme.colors.textMuted)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className={cn(
              "p-8 rounded-[2.5rem] border flex flex-col gap-6 shadow-xl",
              theme.isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-100"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500 text-white">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={cn("text-xl font-black uppercase tracking-tight", theme.isDark ? "text-red-400" : "text-red-600")}>
                    {isAdmin ? t('personPage.confirmDeletion') : t('personPage.proposeRemoval')}
                  </h3>
                  <p className={cn("text-sm font-medium", theme.isDark ? "text-red-400/60" : "text-red-600/60")}>
                    {isAdmin ? t('personPage.permanentDeleteNote') : t('personPage.removalNote')}
                  </p>
                </div>
              </div>

              {!isAdmin && (
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t('personPage.deleteReason')}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-sm outline-none resize-none h-24 transition-all focus:ring-4 focus:ring-red-500/10",
                    theme.colors.bg,
                    theme.colors.border,
                    theme.colors.text
                  )}
                />
              )}

              <div className="flex items-center gap-3">
                <button
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAdmin ? <Trash2 className="w-4 h-4" /> : <X className="w-4 h-4" />)}
                  {isAdmin ? t('personPage.deletePermanently') : t('personPage.submitRemoval')}
                </button>
                <button
                  disabled={deleteMutation.isPending}
                  onClick={() => { setIsConfirmingDelete(false); setDeleteReason(""); }}
                  className={cn(
                    "px-8 py-4 rounded-2xl border font-black text-xs uppercase tracking-[0.2em] transition-all",
                    theme.colors.border,
                    theme.colors.text,
                    "hover:bg-black/5"
                  )}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isConfirmingClaim && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className={cn(
              "p-8 rounded-[2.5rem] border flex flex-col gap-6 shadow-xl",
              theme.isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-orange-50 border-orange-100"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl text-white", theme.colors.primary)}>
                   <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={cn("text-xl font-black uppercase tracking-tight", theme.isDark ? "text-indigo-400" : "text-orange-600")}>
                    {isAdmin ? t('personPage.claimThisProfile') : t('personPage.requestClaim')}
                  </h3>
                  <p className={cn("text-sm font-medium", theme.isDark ? "text-indigo-400/60" : "text-orange-600/60")}>
                    {isAdmin ? t('personPage.claimNote.admin') : t('personPage.claimNote.user')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate()}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2",
                    theme.colors.primary
                  )}
                >
                  {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isAdmin ? t('personPage.confirmClaim') : t('personPage.submitClaim')}
                </button>
                <button
                  disabled={claimMutation.isPending}
                  onClick={() => setIsConfirmingClaim(false)}
                  className={cn(
                    "px-8 py-4 rounded-2xl border font-black text-xs uppercase tracking-[0.2em] transition-all",
                    theme.colors.border,
                    theme.colors.text,
                    "hover:bg-black/5"
                  )}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        {data && (
          <div className="space-y-10">
            {/* Profile Header */}
            <div className={cn("p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500", theme.colors.surface, theme.colors.border)}>
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                <div className={cn("w-40 h-40 rounded-[3rem] flex items-center justify-center border-8 shadow-2xl transition-colors duration-500 shrink-0 overflow-hidden", theme.colors.primaryMuted, theme.colors.border)}>
                  {data.imageUrl ? (
                    <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className={cn("w-20 h-20", theme.colors.accent)} />
                  )}
                </div>
                <div className="flex-1 space-y-6 pt-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                      <h1 className={cn("text-5xl font-black tracking-tight transition-colors duration-500", theme.colors.text)}>
                        {data.firstName} {data.lastName}
                      </h1>
                      {data.nickname && (
                        <p className={cn("text-lg font-medium italic text-center md:text-left transition-colors duration-500", theme.colors.textMuted)}>
                          "{data.nickname}"
                        </p>
                      )}
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                        data.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : cn(theme.colors.bg, theme.colors.textMuted)
                      )}>
                        {t('personPage.statusBadge.' + data.status)}
                      </span>
                    </div>
                        <p className={cn("text-lg font-medium transition-colors duration-500 opacity-60", theme.colors.text)}>{t('personPage.addedToTree').replace('{date}', formatDate(data.createdAt))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={cn("flex gap-12 border-b transition-colors duration-500", theme.colors.border)}>
              {(["about", "permissions"] as const)
                .filter(tab => tab !== 'permissions' || data.userPermission === 'owner' || data.userPermission === 'editor')
                .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-6 text-xs font-black uppercase tracking-[0.3em] transition-all relative",
                    activeTab === tab ? theme.colors.accent : cn(theme.colors.textMuted, "hover:" + theme.colors.text)
                  )}
                >
                  {t('personPage.tab.' + tab)}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className={cn("absolute bottom-0 left-0 right-0 h-1.5 rounded-full", theme.colors.primary)} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn("p-10 rounded-[3rem] border shadow-2xl transition-colors duration-500", theme.colors.surface, theme.colors.border)}
                >
                  <PersonForm 
                    initialData={data} 
                    onSubmit={(vals) => updateMutation.mutate(vals)}
                    isLoading={updateMutation.isPending} 
                  />
                </motion.div>
              ) : activeTab === "about" ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-10"
                >
                  {/* Detailed Info */}
                  <div className="md:col-span-2 space-y-10">
                    <div className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                      <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>{t('personPage.identity')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-2">
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.gender')}</p>
                          <p className={cn("text-lg font-bold capitalize transition-colors duration-500", theme.colors.text)}>{data.gender || t('common.unknown')}</p>
                        </div>
                        <div className="space-y-2">
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.nickname')}</p>
                          {data.nickname ? (
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>{data.nickname}</p>
                          ) : (
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.notProvided')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.birthDate')}</p>
                          <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>
                            {formatDate(data.birthDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Education History */}
                    {data.educations && data.educations.length > 0 && (
                      <div className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-8 transition-colors duration-500 relative", theme.colors.surface, theme.colors.border)}>
                        <div className="flex items-center justify-between">
                            <h3 className={cn("text-2xl font-black flex items-center gap-4 transition-colors duration-500", theme.colors.text)}>
                                <GraduationCap className={cn("w-8 h-8", theme.colors.accent)} />
                                {t('personPage.education')}
                            </h3>
                            <button 
                                onClick={() => updateMutation.mutate({ educationSectionVisible: !data.educationSectionVisible })}
                                className={cn("p-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5", data.educationSectionVisible ? "text-primary" : "text-red-500")}
                                title={data.educationSectionVisible ? t('personPage.visibleToFamily') : t('personPage.hiddenFromFamily')}
                            >
                                {data.educationSectionVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                            </button>
                        </div>
                        <div className="space-y-10">
                            {[...data.educations].sort((a, b) => new Date(b.endDate || b.startDate).getTime() - new Date(a.endDate || a.startDate).getTime()).map((edu) => (
                                <div key={edu.id} className="relative pl-12 before:absolute before:left-[15px] before:top-2 before:bottom-[-40px] last:before:hidden before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                    <div className={cn("absolute left-0 top-1 w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm transition-colors", theme.colors.bg, theme.colors.border)}>
                                        <GraduationCap className={cn("w-4 h-4", theme.isDark ? "text-slate-200" : theme.colors.textMuted)} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className={cn("text-xl font-bold leading-tight", theme.colors.text)}>{edu.school}</h4>
                                        <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium", theme.isDark ? "text-slate-300" : "text-slate-500")}>
                                            <span>{edu.degree}</span>
                                            <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : t('common.present')}
                                            </span>
                                        </div>
                                        {edu.description && (
                                            <p className={cn("text-base leading-relaxed mt-4 max-w-2xl", theme.isDark ? "text-slate-300" : theme.colors.textMuted)}>{edu.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Occupation History */}
                    {data.occupations && data.occupations.length > 0 && (
                      <div className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-8 transition-colors duration-500 relative", theme.colors.surface, theme.colors.border)}>
                        <div className="flex items-center justify-between">
                            <h3 className={cn("text-2xl font-black flex items-center gap-4 transition-colors duration-500", theme.colors.text)}>
                                <Briefcase className={cn("w-8 h-8", theme.colors.accent)} />
                                {t('personPage.occupation')}
                            </h3>
                            <button 
                                onClick={() => updateMutation.mutate({ occupationSectionVisible: !data.occupationSectionVisible })}
                                className={cn("p-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5", data.occupationSectionVisible ? "text-primary" : "text-red-500")}
                                title={data.occupationSectionVisible ? t('personPage.visibleToFamily') : t('personPage.hiddenFromFamily')}
                            >
                                {data.occupationSectionVisible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                            </button>
                        </div>
                        <div className="space-y-10">
                            {[...data.occupations].sort((a, b) => {
                                if (a.isCurrent && !b.isCurrent) return -1;
                                if (!a.isCurrent && b.isCurrent) return 1;
                                return new Date(b.endDate || b.startDate).getTime() - new Date(a.endDate || a.startDate).getTime();
                            }).map((occ) => (
                                <div key={occ.id} className="relative pl-12 before:absolute before:left-[15px] before:top-2 before:bottom-[-40px] last:before:hidden before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                    <div className={cn("absolute left-0 top-1 w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm transition-colors", theme.colors.bg, theme.colors.border)}>
                                        <Briefcase className={cn("w-4 h-4", theme.isDark ? "text-slate-200" : theme.colors.textMuted)} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <h4 className={cn("text-xl font-bold leading-tight", theme.colors.text)}>{occ.title}</h4>
                                            {occ.isCurrent && (
                                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">{t('common.current')}</span>
                                            )}
                                        </div>
                                        <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium", theme.isDark ? "text-slate-300" : "text-slate-500")}>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {occ.company}</span>
                                            <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(occ.startDate)} - {occ.isCurrent ? t('common.present') : (occ.endDate ? formatDate(occ.endDate) : '')}
                                            </span>
                                        </div>
                                        {occ.description && (
                                            <p className={cn("text-base leading-relaxed mt-4 max-w-2xl", theme.isDark ? "text-slate-300" : theme.colors.textMuted)}>{occ.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                      <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>{t('personPage.contactDetails')}</h3>
                      <div className="space-y-6">
                        <div className={cn("flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500", theme.colors.surface)}>
                            <Mail className={cn("w-6 h-6", theme.colors.textMuted)} />
                          </div>
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.email')}</p>
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>{data.email || t('personPage.notProvided')}</p>
                          </div>
                        </div>
                        <div className={cn("flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500", theme.colors.surface)}>
                            <Phone className={cn("w-6 h-6", theme.colors.textMuted)} />
                          </div>
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.phone')}</p>
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>{data.phone || t('personPage.notProvided')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-10">
                    <div className={cn("p-10 rounded-[3rem] text-white shadow-2xl transition-all duration-500", theme.isDark ? "bg-slate-800" : "bg-linear-to-br from-slate-800 to-slate-900")}>
                      <ShieldAlert className="w-10 h-10 mb-6 opacity-40" />
                      <h3 className="text-2xl font-black mb-3">{t('personPage.dataPrivacy.title')}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        {t('personPage.dataPrivacy.desc')}
                      </p>
                    </div>

                    {/* Suggestions */}
                    {(suggestions?.siblings?.length > 0 || suggestions?.spouses?.length > 0) && (
                      <div className={cn("p-8 rounded-[3rem] border shadow-sm space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.suggestions')}</h3>
                        </div>
                        <div className="space-y-4">
                          {suggestions.siblings.map((s: any) => (
                            <div key={s.id} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                              <div className="min-w-0">
                                <p className={cn("text-sm font-black truncate transition-colors duration-500", theme.colors.text)}>{s.firstName} {s.lastName}</p>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{t('personPage.potentialSibling')}</p>
                              </div>
                              <button
                                onClick={() => router.push(`/person/${s.id}`)}
                                className={cn("p-2.5 rounded-xl shadow-sm transition-all", theme.colors.surface, "hover:scale-110", theme.colors.textMuted, "hover:" + theme.colors.accent)}
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {suggestions.spouses.map((s: any) => (
                            <div key={s.id} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                              <div className="min-w-0">
                                <p className={cn("text-sm font-black truncate transition-colors duration-500", theme.colors.text)}>{s.firstName} {s.lastName}</p>
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">{t('personPage.potentialSpouse')}</p>
                              </div>
                              <button
                                onClick={() => router.push(`/person/${s.id}`)}
                                className={cn("p-2.5 rounded-xl shadow-sm transition-all", theme.colors.surface, "hover:scale-110", theme.colors.textMuted, "hover:text-pink-500")}
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Actions */}
                    <div className={cn("p-8 rounded-[3rem] border shadow-sm space-y-4 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>{t('personPage.adminSection')}</h3>
                      <button
                        onClick={() => setShowMergeModal(true)}
                        disabled={data.userPermission !== 'owner' && data.userPermission !== 'editor'}
                        className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all border group",
                            data.userPermission === 'owner' || data.userPermission === 'editor'
                                ? cn(theme.colors.primaryMuted, theme.colors.accent, "hover:opacity-80 shadow-sm")
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-transparent opacity-50"
                        )}
                        title={data.userPermission === 'owner' || data.userPermission === 'editor' ? t('personPage.mergeProfile') : t('personPage.noMergePermission')}
                      >
                        <GitMerge className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {t('personPage.mergeProfile')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PersonPermissionsTab personId={data.id} treeId={data.treeId} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showMergeModal && (
                <MergeProfileModal
                  treeId={data.treeId}
                  sourcePerson={{ id: data.id, firstName: data.firstName, lastName: data.lastName! }}
                  onClose={() => setShowMergeModal(false)}
                  onSuccess={() => {
                    // Success handling is managed in the modal
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </DataState>
    </div>
  );
}
