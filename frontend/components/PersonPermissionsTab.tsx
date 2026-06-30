"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { ShieldCheck, UserPlus, Trash2, Loader2, Search, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import CustomSelect from "./ui/CustomSelect";

interface PersonPermissionsTabProps {
  personId: string;
  treeId: string;
}

export default function PersonPermissionsTab({ personId, treeId }: PersonPermissionsTabProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [permissionType, setPermissionType] = useState<"owner" | "editor">("editor");
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const { data: permissions, isLoading: isLoadingPerms } = useQuery({
    queryKey: ["person-permissions", personId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/people/${personId}/permissions`);
      return (res as any).data;
    },
  });

  const { data: treeMembers } = useQuery({
    queryKey: ["tree-members", treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/members`);
      return (res as any).data;
    },
  });

  const grantMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/trees/${treeId}/people/${personId}/permissions`, {
        userId: selectedUserId,
        permission: permissionType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-permissions", personId] });
      setSelectedUserId("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.delete(`/trees/${treeId}/people/${personId}/permissions/${targetUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-permissions", personId] });
    },
  });

  const filteredMembers = treeMembers?.filter((m: any) => 
    !permissions?.some((p: any) => p.userId === m.id) &&
    ((m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
     (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 transition-colors duration-500">
      <div className="md:col-span-2 space-y-10">
        {/* Current Permissions */}
        <div className={cn("p-10 rounded-2xl border-2 shadow-pop-sm space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
          <div className="flex items-center justify-between">
            <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>{t('permissionsTab.activePermissions')}</h3>
            <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors duration-500", theme.colors.primaryMuted, theme.colors.accent, "border-primary/20")}>
              {permissions?.length || 0} {t('permissionsTab.explicitUsers')}
            </span>
          </div>

          <div className={cn("divide-y transition-colors duration-500", theme.colors.border)}>
            {isLoadingPerms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={cn("w-10 h-10 animate-spin", theme.colors.accent)} />
              </div>
            ) : permissions?.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <ShieldCheck className={cn("w-16 h-16 mx-auto opacity-20", theme.colors.textMuted)} />
                <p className={cn("font-medium", theme.colors.textMuted)}>{t('permissionsTab.noPermissions')}</p>
              </div>
            ) : (
              permissions?.map((p: any) => (
                <div key={p.userId} className="py-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500", theme.colors.bg)}>
                      <User className={cn("w-6 h-6 opacity-40", theme.colors.text)} />
                    </div>
                    <div>
                      <p className={cn("text-lg font-black transition-colors duration-500", theme.colors.text)}>{p.name}</p>
                      <p className={cn("text-sm font-medium transition-colors duration-500", theme.colors.textMuted)}>{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      p.permission === 'owner' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : cn(theme.colors.primaryMuted, theme.colors.accent)
                    )}>
                      {p.permission}
                    </span>
                    <button
                      onClick={() => revokeMutation.mutate(p.userId)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grant New Permission */}
        <div className={cn("p-10 rounded-2xl border-2 shadow-pop-sm space-y-8 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
          <h3 className={cn("text-2xl font-black transition-colors duration-500", theme.colors.text)}>{t('permissionsTab.grantAccess')}</h3>
          
          <div className="space-y-6">
            <div className="relative group">
              <Search className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:" + theme.colors.accent + " transition-colors")} />
              <input
                type="text"
                placeholder={t('permissionsTab.searchPlaceholder')}
                className={cn(
                  "w-full pl-14 pr-6 py-5 rounded-xl text-sm font-bold outline-none transition-all border",
                  theme.colors.bg,
                  theme.colors.border,
                  "focus:ring-8 focus:ring-primary/10 focus:border-primary/50",
                  theme.colors.text
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
              {filteredMembers?.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedUserId(m.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                    selectedUserId === m.id 
                      ? cn(theme.colors.primaryMuted, "border-primary/50 ring-4 ring-primary/10") 
                      : cn(theme.colors.surface, theme.colors.border, "hover:opacity-80")
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500", theme.colors.bg)}>
                    <User className={cn("w-5 h-5 opacity-40", theme.colors.text)} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("font-black text-sm truncate transition-colors duration-500", theme.colors.text)}>{m.name}</p>
                    <p className={cn("text-[10px] font-medium truncate transition-colors duration-500", theme.colors.textMuted)}>{m.email}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <CustomSelect
                options={[
                  { value: "editor", label: "Editor (Can edit fields)" },
                  { value: "owner", label: "Owner (Full control)" }
                ]}
                value={permissionType}
                onChange={(val) => setPermissionType(val as any)}
                className="flex-1"
                size="lg"
              />
              <button
                disabled={!selectedUserId || grantMutation.isPending}
                onClick={() => grantMutation.mutate()}
                className={cn(
                  "px-10 py-5 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-pop-lg disabled:opacity-50",
                  theme.colors.primary
                )}
              >
                {grantMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {t('permissionsTab.grant')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <div className={cn("p-10 rounded-2xl text-white shadow-pop-lg border-2 border-white/10 transition-all duration-500", "bg-card")}>
          <ShieldCheck className={cn("w-12 h-12 mb-8 opacity-40", theme.isDark ? theme.colors.accent : "text-white")} />
          <h3 className="text-2xl font-black mb-4">{t('permissionsTab.accessControl.title')}</h3>
          <p className="text-white/70 text-sm leading-relaxed font-medium">
            {t('permissionsTab.accessControl.desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
