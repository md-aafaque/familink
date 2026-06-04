"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, ArrowRight, Calendar, GitPullRequest, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";

export default function ManageProposalsPage() {
  const queryClient = useQueryClient();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();

  // Fetch trees first to get a list
  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      const data = (res as any).data;
      if (data?.length > 0 && !selectedTreeId) {
        const adminTree = data.find((t: any) => t.role === 'admin');
        setSelectedTreeId(adminTree?.id || data[0].id);
      }
      return data;
    },
  });

  const { data: proposals, isLoading, isError, error } = useQuery({
    queryKey: ["tree-proposals", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/relationship-proposals`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const approveMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/trees/${selectedTreeId}/relationship-proposals/${proposalId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-proposals", selectedTreeId] });
      queryClient.invalidateQueries({ queryKey: ["tree-visual", selectedTreeId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string, reason: string }) => {
      await api.post(`/trees/${selectedTreeId}/relationship-proposals/${proposalId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-proposals", selectedTreeId] });
    },
  });

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Relationship <span className={theme.colors.accent}>Proposals</span>
        </h1>
        <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
          Review and verify family connections proposed by members. Your approval ensures the accuracy of the lineage.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2rem] shadow-xl overflow-hidden transition-colors duration-500", theme.isDark ? "bg-slate-900" : "bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <GitPullRequest className="w-32 h-32 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Source Workspace</h3>
              <p className="text-slate-300 font-medium">Select the family tree you want to review proposals for.</p>
            </div>
            
            <div className="relative min-w-[300px]">
              <select
                value={selectedTreeId}
                onChange={(e) => setSelectedTreeId(e.target.value)}
                className="w-full pl-6 pr-12 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-white focus:ring-4 focus:ring-primary/30 outline-none appearance-none transition-all cursor-pointer backdrop-blur-md"
              >
                {!trees && <option className="text-slate-900">Loading trees...</option>}
                {trees?.map((tree: any) => (
                  <option key={tree.id} value={tree.id} className="text-slate-900">
                    {tree.name} ({tree.role})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        <div className="grid grid-cols-1 gap-6">
          {proposals?.length > 0 ? (
            proposals.map((prop: any) => (
              <motion.div 
                layout
                key={prop.id}
                className={cn("p-8 rounded-[2rem] border shadow-sm hover:shadow-md transition-all flex flex-col items-stretch gap-8", theme.colors.surface, theme.colors.border)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Proposed {formatDate(prop.createdAt)} by {prop.proposerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveMutation.mutate(prop.id)}
                      disabled={approveMutation.isPending}
                      className={cn(
                        "px-6 py-3 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95 disabled:opacity-50",
                        theme.colors.primary
                      )}
                    >
                      <Check className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate({ proposalId: prop.id, reason: 'Rejected by admin' })}
                      disabled={rejectMutation.isPending}
                      className={cn(
                        "px-6 py-3 border rounded-2xl font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50",
                        theme.colors.bg,
                        theme.colors.border,
                        theme.colors.textMuted,
                        "hover:text-red-600 hover:border-red-100 hover:bg-red-50"
                      )}
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4">
                  {/* Person 1 */}
                  <div className={cn("w-full md:w-64 p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 transition-colors duration-500", theme.colors.bg, theme.colors.border)}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
                      <User className={cn("w-6 h-6", theme.colors.accent)} />
                    </div>
                    <div>
                      <h4 className={cn("font-black text-lg", theme.colors.text)}>{prop.fromPerson.firstName} {prop.fromPerson.lastName}</h4>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", theme.colors.textMuted)}>Subject</p>
                    </div>
                  </div>

                  {/* Arrow & Type */}
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn("px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.colors.primaryMuted, theme.colors.textMuted, theme.colors.border)}>
                      {prop.relationshipType}
                    </div>
                    <ArrowRight className={cn("w-8 h-8 hidden md:block", theme.colors.accent)} />
                    <div className="w-0.5 h-8 bg-slate-200 md:hidden" />
                  </div>

                  {/* Person 2 */}
                  <div className={cn("w-full md:w-64 p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 transition-colors duration-500", theme.colors.bg, theme.colors.border)}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
                      <User className={cn("w-6 h-6", theme.colors.accent)} />
                    </div>
                    <div>
                      <h4 className={cn("font-black text-lg", theme.colors.text)}>{prop.toPerson.firstName} {prop.toPerson.lastName}</h4>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", theme.colors.textMuted)}>Target</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={cn("border-2 border-dashed rounded-[2rem] p-20 text-center space-y-6 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", theme.colors.bg)}>
                <GitPullRequest className={cn("w-10 h-10", theme.colors.textMuted)} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-xl font-bold", theme.colors.text)}>All caught up!</h3>
                <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                  There are no pending relationship proposals to review for this tree.
                </p>
              </div>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
