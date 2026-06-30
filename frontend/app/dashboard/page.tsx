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
  Sparkles,
} from "lucide-react";

import DataState from "../../components/shared/DataState";
import { motion } from "framer-motion";
import Skeleton from "../../components/shared/Skeleton";
import { cn } from "@/lib/cn";
import { formatDate } from "../../lib/dateUtils";
import { useAppTheme } from "../../components/providers/ThemeProvider";
import { useLanguage } from "../../components/providers/LanguageProvider";
import MemoryCard from "@/components/memories/MemoryCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  },
};

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card p-6 space-y-4 shadow-pop-lg">
      <div className="w-12 h-12 rounded-full bg-muted" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function TreeCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card overflow-hidden shadow-pop-lg">
      <div className="h-2 bg-muted" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

const accentColors = [
  { bg: "bg-[#F97316]/15 dark:bg-[#FB923C]/20", circle: "bg-[#F97316] dark:bg-[#FB923C]", border: "border-[#F97316] dark:border-[#FB923C]", icon: "text-white", shadow: "shadow-pop-orange", strip: "bg-[#F97316] dark:bg-[#FB923C]" },
  { bg: "bg-[#F472B6]/15 dark:bg-[#F9A8D4]/20", circle: "bg-[#F472B6] dark:bg-[#F9A8D4]", border: "border-[#F472B6] dark:border-[#F9A8D4]", icon: "text-white", shadow: "shadow-pop-pink", strip: "bg-[#F472B6] dark:bg-[#F9A8D4]" },
  { bg: "bg-[#FBBF24]/15 dark:bg-[#FCD34D]/20", circle: "bg-[#FBBF24] dark:bg-[#FCD34D]", border: "border-[#FBBF24] dark:border-[#FCD34D]", icon: "text-[#1E293B] dark:text-[#0F172A]", shadow: "shadow-pop-amber", strip: "bg-[#FBBF24] dark:bg-[#FCD34D]" },
  { bg: "bg-[#34D399]/15 dark:bg-[#6EE7B7]/20", circle: "bg-[#34D399] dark:bg-[#6EE7B7]", border: "border-[#34D399] dark:border-[#6EE7B7]", icon: "text-white", shadow: "shadow-pop-emerald", strip: "bg-[#34D399] dark:bg-[#6EE7B7]" },
];

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-foreground border-t-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">
            {t('dashboard.loading')}
          </p>
        </div>
      </div>
    );
  }

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
    enabled: !!user,
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

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

  const activeTrees = trees?.filter((t: any) => t.status === 'active') || [];
  const totalMembers = activeTrees.reduce((sum: number, t: any) => sum + (t.memberCount || 0), 0);
  const stats = [
    { icon: TreeDeciduous, value: activeTrees.length, label: t('dashboard.stats.activeTrees'), color: accentColors[0] },
    { icon: Users, value: totalMembers, label: t('dashboard.stats.members'), color: accentColors[1] },
    { icon: Clock, value: activeTree?.createdAt ? formatDate(activeTree.createdAt) : '--', label: t('dashboard.stats.lastUpdate'), color: accentColors[2] },
  ];

  const treeAccentColors = [accentColors[0], accentColors[1], accentColors[2], accentColors[3]];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.section variants={itemVariants} className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {t('dashboard.welcome').replace('{name}', '')}
              <span className="text-[#F97316] dark:text-[#FB923C] ml-2">
                {userName}
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#FBBF24] dark:border-[#FCD34D] bg-[#FBBF24]/10 dark:bg-[#FCD34D]/10 shadow-pop-sm">
            <Sparkles className="w-4 h-4 text-[#FBBF24] dark:text-[#FCD34D]" />
            <span className="text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] uppercase tracking-wider">
              FamiLink
            </span>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className={cn(
                  "relative rounded-xl border-2 border-foreground bg-card pt-8 pb-6 px-6",
                  stat.color.shadow,
                  "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)]"
                )}
                style={{ '--shadow-color': stat.color.shadow.includes('orange') ? '#F97316' : stat.color.shadow.includes('pink') ? '#F472B6' : '#FBBF24' } as React.CSSProperties}
              >
                <div
                  className={cn(
                    "absolute -top-5 left-6 w-12 h-12 rounded-full border-2 border-foreground flex items-center justify-center shadow-pop-sm",
                    stat.color.circle
                  )}
                >
                  <stat.icon className={cn("w-5 h-5", stat.color.icon)} />
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Recent Memories Section */}
      {recentMemories && recentMemories.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#34D399]/15 dark:bg-[#6EE7B7]/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#34D399] dark:text-[#6EE7B7]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {t('dashboard.recentMemories')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentMemories.map((memory: any, i: number) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
              >
                <MemoryCard memory={memory} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Trees Section */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/15 dark:bg-[#FB923C]/20 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-[#F97316] dark:text-[#FB923C]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {t('dashboard.familyTrees')}
            </h2>
            {trees && trees.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F97316]/10 dark:bg-[#FB923C]/20 text-[#F97316] dark:text-[#FB923C] border border-[#F97316]/20 dark:border-[#FB923C]/30">
                {trees.length}
              </span>
            )}
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link
              href="/dashboard/new-tree"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] dark:active:shadow-[2px_2px_0px_0px_#000000] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.newTree')}
            </Link>
          </motion.div>
        </div>

        <DataState
          isLoading={false}
          isError={isError}
          error={error as Error}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <TreeCardSkeleton key={i} />
              ))}
            </div>
          ) : trees && trees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trees.map((tree: any, i: number) => {
                const accent = treeAccentColors[i % treeAccentColors.length];
                return (
                  <motion.div
                    key={tree.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
                    whileHover={tree.status !== 'pending' ? { scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
                    className={cn(
                      "relative rounded-xl border-2 border-foreground bg-card overflow-hidden shadow-pop-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[10px_10px_0px_0px_#E2E8F0] dark:hover:shadow-[10px_10px_0px_0px_#0F172A]",
                      tree.status === 'pending' && "opacity-60"
                    )}
                  >
                    {/* Top Accent Strip */}
                    <div className={cn("h-2", accent.strip)} />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={tree.status === 'pending' ? '#' : `/tree/${tree.id}`}
                          className="flex-1 min-w-0"
                        >
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {tree.name}
                              </h3>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                {t('dashboard.tree.created').replace('{date}', formatDate(tree.createdAt))}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                tree.status === 'pending'
                                  ? "bg-[#FBBF24]/15 dark:bg-[#FCD34D]/20 text-[#B45309] dark:text-[#FCD34D] border-[#FBBF24]/30 dark:border-[#FCD34D]/30"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}>
                                {tree.status === 'pending' ? t('role.pending') : t(`role.${tree.role}`)}
                              </span>

                              {tree.memberCount > 0 && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                                  <Users className="w-3 h-3" />
                                  {tree.memberCount}
                                </span>
                              )}

                              {tree.status !== 'pending' && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {t('dashboard.tree.openTree')}
                                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* 3-dot Menu */}
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === tree.id ? null : tree.id); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {menuOpenId === tree.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -8 }}
                              transition={{ duration: 0.15 }}
                              className={cn(
                                "absolute right-0 top-10 w-36 rounded-xl border-2 border-foreground bg-card shadow-pop z-50 p-1.5"
                              )}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveModal({ type: 'rename', tree });
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-xs font-bold text-foreground hover:bg-muted transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                {t('dashboard.tree.rename')}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveModal({ type: 'delete', tree });
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('dashboard.tree.delete')}
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
              className="relative rounded-xl border-2 border-dashed border-foreground/30 bg-card p-12 md:p-16 text-center space-y-6 overflow-hidden"
            >
              {/* Dot grid background */}
              <div className="absolute inset-0 bg-dot-grid opacity-30" />

              {/* Decorative shapes */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#F97316]/10 dark:bg-[#FB923C]/10" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-[#FBBF24]/10 dark:bg-[#FCD34D]/10" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-4">
                  <TreeDeciduous className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-foreground">
                    {t('dashboard.noTrees.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('dashboard.noTrees.subtitle')}
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href="/dashboard/new-tree"
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] dark:active:shadow-[2px_2px_0px_0px_#000000] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  >
                    {t('dashboard.noTrees.button')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </DataState>
      </motion.section>

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
    </motion.div>
  );
}
