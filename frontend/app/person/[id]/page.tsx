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
  Link2
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dateUtils";
import MergeProfileModal from "@/components/MergeProfileModal";
import PersonPermissionsTab from "@/components/PersonPermissionsTab";
import { Person } from "@/lib/shared/schemas/people";

import { useAppTheme } from "@/components/providers/ThemeProvider";

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
  const { theme } = useAppTheme();

  const { data, isLoading, isError, error } = useQuery<Person>({
    queryKey: ["person", id],
    queryFn: async () => {
      // Temporary solution: We need treeId to call the new API.
      // If we don't have it, we'll need a global lookup or the frontend navigation needs to be updated.
      // For now, I'll call a hypothetical 'global' endpoint to get the person (and their treeId).
      const res = await api.get<any, ApiResponse<Person>>(`/people/${id}/global`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: suggestions } = useQuery<any>({
    queryKey: ["person-suggestions", id, data?.treeId],
    queryFn: async () => {
      // Suggestion API also needs treeId now because of tree isolation
      const res = await api.get<any, ApiResponse<any>>(`/trees/${data?.treeId}/people/${id}/suggestions`);
      return res.data;
    },
    enabled: !!id && !!data?.treeId,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      const res = await api.patch(`/trees/${data?.treeId}/people/${id}`, input);
      return (res as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", id] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/trees/${data?.treeId}/people/${id}`);
    },
    onSuccess: () => {
      router.back();
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this profile? This action is reversible by an admin.")) {
      deleteMutation.mutate();
    }
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/people/${id}/claim`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", id] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 transition-colors duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className={cn("flex items-center gap-2 transition-colors group", theme.colors.textMuted, "hover:" + theme.colors.text)}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-4">
          {!isEditing && (
            <>
              {data?.status === 'ghost' && (
                <button
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  className={cn("px-6 py-2.5 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/10", theme.colors.primary)}
                >
                  <Sparkles className="w-4 h-4" />
                  {claimMutation.isPending ? "Claiming..." : "Claim Profile"}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className={cn("px-6 py-2.5 border rounded-2xl text-sm font-black uppercase tracking-widest transition-all", theme.colors.surface, theme.colors.border, theme.colors.text, "hover:opacity-80")}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className={cn("px-6 py-2.5 text-sm font-black uppercase tracking-widest", theme.colors.textMuted)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        {data && (
          <div className="space-y-10">
            {/* Profile Header */}
            <div className={cn("p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500", theme.colors.surface, theme.colors.border)}>
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                <div className={cn("w-40 h-40 rounded-[3rem] flex items-center justify-center border-8 shadow-2xl transition-colors duration-500 shrink-0", theme.colors.primaryMuted, theme.colors.border)}>
                  <UserIcon className={cn("w-20 h-20", theme.colors.accent)} />
                </div>
                <div className="flex-1 space-y-6 pt-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                      <h1 className={cn("text-5xl font-black tracking-tight transition-colors duration-500", theme.colors.text)}>
                        {data.firstName} {data.lastName}
                      </h1>
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                        data.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : cn(theme.colors.bg, theme.colors.textMuted)
                      )}>
                        {data.status}
                      </span>
                    </div>
                    <p className={cn("text-lg font-medium transition-colors duration-500 opacity-60", theme.colors.text)}>Tree Member • Added {formatDate(data.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={cn("flex gap-12 border-b transition-colors duration-500", theme.colors.border)}>
              {(["about", "permissions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-6 text-xs font-black uppercase tracking-[0.3em] transition-all relative",
                    activeTab === tab ? theme.colors.accent : cn(theme.colors.textMuted, "hover:" + theme.colors.text)
                  )}
                >
                  {tab}
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
                      <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>Identity</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-2">
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Gender</p>
                          <p className={cn("text-lg font-bold capitalize transition-colors duration-500", theme.colors.text)}>{data.gender || 'Unknown'}</p>
                        </div>
                        <div className="space-y-2">
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Birth Date</p>
                          <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>
                            {formatDate(data.birthDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                      <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>Contact Details</h3>
                      <div className="space-y-6">
                        <div className={cn("flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500", theme.colors.surface)}>
                            <Mail className={cn("w-6 h-6", theme.colors.textMuted)} />
                          </div>
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Email Address</p>
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>{data.email || 'Private or not provided'}</p>
                          </div>
                        </div>
                        <div className={cn("flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500", theme.colors.surface)}>
                            <Phone className={cn("w-6 h-6", theme.colors.textMuted)} />
                          </div>
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Phone Number</p>
                            <p className={cn("text-lg font-bold transition-colors duration-500", theme.colors.text)}>{data.phone || 'Private or not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-10">
                    <div className={cn("p-10 rounded-[3rem] text-white shadow-2xl transition-all duration-500", theme.isDark ? "bg-slate-800" : "bg-linear-to-br from-slate-800 to-slate-900")}>
                      <ShieldAlert className="w-10 h-10 mb-6 opacity-40" />
                      <h3 className="text-2xl font-black mb-3">Data Privacy</h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        This profile's visibility is managed by tree administrators. 
                        Sensitive data is only shown based on the permissions granted.
                      </p>
                    </div>

                    {/* Suggestions */}
                    {(suggestions?.siblings?.length > 0 || suggestions?.spouses?.length > 0) && (
                      <div className={cn("p-8 rounded-[3rem] border shadow-sm space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Suggestions</h3>
                        </div>
                        <div className="space-y-4">
                          {suggestions.siblings.map((s: any) => (
                            <div key={s.id} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-500", theme.colors.bg, theme.colors.border)}>
                              <div className="min-w-0">
                                <p className={cn("text-sm font-black truncate transition-colors duration-500", theme.colors.text)}>{s.firstName} {s.lastName}</p>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Potential Sibling</p>
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
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">Potential Spouse</p>
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
                      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.textMuted)}>Administration</h3>
                      <button
                        onClick={() => setShowMergeModal(true)}
                        className={cn("w-full flex items-center gap-4 p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all border group", theme.colors.primaryMuted, theme.colors.accent, theme.colors.border.replace('border-', 'border-'), "hover:opacity-80 shadow-sm")}
                      >
                        <GitMerge className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Merge Profile
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
                  sourcePerson={{ id: data.id, firstName: data.firstName, lastName: data.lastName }}
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
