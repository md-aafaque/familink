"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/providers/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import Link from "next/link";
import TreeActionModal from "../../components/TreeActionModal";

import {
  TreeDeciduous,
  Plus,
  ArrowRight,
  Users,
  Clock,
  LayoutGrid,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";

import DataState from "../../components/shared/DataState";
import { motion } from "framer-motion";
import Skeleton from "../../components/shared/Skeleton";
import { cn } from "@/lib/cn";
import { formatDate } from "../../lib/dateUtils";
import { useAppTheme } from "../../components/providers/ThemeProvider";
import { useLanguage } from "../../components/providers/LanguageProvider";
import MemoryCard from "@/components/memories/MemoryCard";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: 'rename' | 'delete', tree: any } | null>(null);
  const queryClient = useQueryClient();

  const deleteTreeMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/trees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trees"] }),
  });

  const renameTreeMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => await api.patch(`/trees/${id}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trees"] }),
  });

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Wait for auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className={cn("text-sm font-medium animate-pulse", theme.colors.textMuted)}>
          {t('dashboard.loading')}
        </div>
      </div>
    );
  }

  // Prevent render before redirect
  if (!user) {
    return null;
  }

  const {
    data: trees,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["trees"],
    enabled: !!user, // only fetch when authenticated
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

  // Fetch recent memories for the first active tree
  const activeTree = trees?.find((t: any) => t.status === 'active');
  const { data: recentMemories } = useQuery({
    queryKey: ['memories', activeTree?.id],
    queryFn: async () => {
      const res = await api.get(`/trees/${activeTree?.id}/memories?limit=3`);
      return (res as any).data;
    },
    enabled: !!activeTree,
  });

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <header className="space-y-2">
        <h1 className={cn("text-3xl font-bold tracking-tight", theme.colors.text)}>
          {t('dashboard.welcome').replace('{name}', userName)}
        </h1>
        <p className={cn("text-base max-w-2xl", theme.colors.textMuted)}>
          {t('dashboard.subtitle')}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className={cn("p-6 rounded-lg border shadow-sm space-y-3", theme.colors.surface, theme.colors.border)}>
              <Skeleton className="w-10 h-10 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className={cn("p-6 rounded-lg border shadow-sm transition-all hover:shadow-md", theme.colors.surface, theme.colors.border)}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", theme.colors.primaryMuted)}>
                  <TreeDeciduous className={cn("w-5 h-5", theme.colors.accent)} />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className={cn("text-2xl font-bold", theme.colors.text)}>
                  {trees?.filter((t: any) => t.status === 'active').length || 0}
                </p>
                <p className={cn("text-xs font-medium uppercase tracking-wider", theme.colors.textMuted)}>
                  {t('dashboard.stats.activeTrees')}
                </p>
              </div>
            </div>

            <div className={cn("p-6 rounded-lg border shadow-sm transition-all hover:shadow-md", theme.colors.surface, theme.colors.border)}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className={cn("text-2xl font-bold", theme.colors.text)}>
                  {trees?.filter((t: any) => t.status === 'active').reduce((sum: number, t: any) => sum + (t.memberCount || 0), 0) || 0}
                </p>
                <p className={cn("text-xs font-medium uppercase tracking-wider", theme.colors.textMuted)}>
                  {t('dashboard.stats.members')}
                </p>
              </div>
            </div>

            <div className={cn("p-6 rounded-lg border shadow-sm transition-all hover:shadow-md", theme.colors.surface, theme.colors.border)}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className={cn("text-2xl font-bold", theme.colors.text)}>
                  {activeTree?.createdAt ? formatDate(activeTree.createdAt) : '--'}
                </p>
                <p className={cn("text-xs font-medium uppercase tracking-wider", theme.colors.textMuted)}>
                  {t('dashboard.stats.lastUpdate')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Memories Section */}
      {recentMemories && recentMemories.length > 0 && (
        <section className="space-y-6">
            <h2 className={cn("text-xl font-bold flex items-center gap-2.5", theme.colors.text)}>
                <Clock className="w-5 h-5 opacity-50" />
                {t('dashboard.recentMemories')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentMemories.map((memory: any) => (
                    <MemoryCard key={memory.id} memory={memory} />
                ))}
            </div>
        </section>
      )}

      {/* Trees Section */}
      <section className="space-y-6">
        <div className={cn("flex items-center justify-between border-b pb-4", theme.colors.border)}>
          <h2 className={cn("text-xl font-bold flex items-center gap-2.5", theme.colors.text)}>
            <LayoutGrid className="w-5 h-5 opacity-50" />
            {t('dashboard.familyTrees')}
            {trees && trees.length > 0 && (
              <span className={cn("ml-1 text-xs px-2 py-0.5 rounded-full font-bold", theme.colors.bg, theme.colors.textMuted)}>
                {trees.length}
              </span>
            )}
          </h2>

          <Link
            href="/dashboard/new-tree"
            className={cn("flex items-center gap-1.5 text-sm font-semibold hover:underline", theme.colors.accent)}
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.newTree')}
          </Link>
        </div>

        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
        >
          {trees && trees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trees.map((tree: any) => (
                <div
                  key={tree.id}
                  className={cn(
                    "group p-5 rounded-lg border shadow-sm transition-all relative",
                    theme.colors.surface,
                    theme.colors.border,
                    tree.status === 'pending' ? "opacity-60 cursor-not-allowed" : "hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Link
                      href={tree.status === 'pending' ? '#' : `/tree/${tree.id}`}
                      className="flex-1"
                    >
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className={cn("text-lg font-bold group-hover:" + theme.colors.accent + " transition-colors", theme.colors.text)}>
                            {tree.name}
                          </h3>
                          <p className={cn("text-xs font-medium", theme.colors.textMuted)}>
                            {t('dashboard.tree.created').replace('{date}', formatDate(tree.createdAt))}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                           <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            tree.status === 'pending' ? "bg-amber-100 text-amber-700" : cn(theme.colors.bg, theme.colors.textMuted)
                          )}>
                            {tree.status === 'pending' ? t('role.pending') : t(`role.${tree.role}`)}
                          </span>
                          
                          {tree.status !== 'pending' && (
                            <span className={cn("flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity", theme.colors.accent)}>
                              {t('dashboard.tree.openTree')} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    {/* 3-dot Menu */}
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === tree.id ? null : tree.id); }}
                        className={cn("p-1.5 rounded-md", theme.colors.textMuted, "hover:" + theme.colors.bg)}>
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {menuOpenId === tree.id && (
                        <div className={cn("absolute right-8 top-0 w-32 rounded-xl border shadow-xl z-50 p-1", theme.colors.surface, theme.colors.border)}>
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               setActiveModal({ type: 'rename', tree });
                               setMenuOpenId(null);
                             }}
                             className={cn("w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800", theme.colors.text)}>
                             <Edit className="w-3.5 h-3.5" />
                             {t('dashboard.tree.rename')}
                           </button>
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               setActiveModal({ type: 'delete', tree });
                               setMenuOpenId(null);
                             }}
                             className={cn("w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20")}>
                             <Trash2 className="w-3.5 h-3.5" />
                             {t('dashboard.tree.delete')}
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn("border border-dashed rounded-lg p-12 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/50", theme.colors.border)}>
              <div className="space-y-1">
                <h3 className={cn("text-lg font-bold", theme.colors.text)}>
                  {t('dashboard.noTrees.title')}
                </h3>
                <p className={cn("text-sm max-w-sm mx-auto", theme.colors.textMuted)}>
                  {t('dashboard.noTrees.subtitle')}
                </p>
              </div>

              <Link
                href="/dashboard/new-tree"
                className={cn("inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-md text-sm font-bold hover:opacity-90 transition-all shadow-sm", theme.colors.primary)}
              >
                {t('dashboard.noTrees.button')}
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          )}
        </DataState>
      </section>

      {/* Tree Action Modal */}
      {activeModal && (
        <TreeActionModal 
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          type={activeModal.type}
          treeName={activeModal.tree.name}
          onConfirm={(input) => {
            if (activeModal.type === 'rename') renameTreeMutation.mutate({ id: activeModal.tree.id, name: input });
            if (activeModal.type === 'delete') deleteTreeMutation.mutate(activeModal.tree.id);
          }}
        />
      )}
    </div>
  );
}
