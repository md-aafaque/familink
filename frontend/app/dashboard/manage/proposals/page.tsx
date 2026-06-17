"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, ArrowRight, Calendar, GitPullRequest, ChevronDown, Trash2, AlertTriangle, MessageSquare, Link2, Merge, Fingerprint } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import CustomSelect from "@/components/ui/CustomSelect";

type ProposalType = 'relationships' | 'deletions' | 'merges' | 'claims';
import { useSearchParams, useRouter } from "next/navigation";

// ... inside ManageProposalsPage
export default function ManageProposalsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();

  const activeType = (searchParams.get('tab') as ProposalType) || 'relationships';

  const setActiveType = (tab: ProposalType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };


  // Fetch trees first to get a list
  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      const data = (res as any).data;
      // Filter only admin trees for management
      return data?.filter((t: any) => t.role === 'admin') || [];
    },
  });

  // Initialize selectedTreeId
  useEffect(() => {
    if (trees?.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  // Data Fetching
  const { data: relProposals, isLoading: isLoadingRel, isError: isErrorRel, error: errorRel } = useQuery({
    queryKey: ["tree-relationship-proposals", selectedTreeId],
    queryFn: async () => (await api.get(`/trees/${selectedTreeId}/relationship-proposals`)).data,
    enabled: !!selectedTreeId && activeType === 'relationships',
  });

  const { data: delProposals, isLoading: isLoadingDel, isError: isErrorDel, error: errorDel } = useQuery({
    queryKey: ["tree-deletion-proposals", selectedTreeId],
    queryFn: async () => (await api.get(`/trees/${selectedTreeId}/deletion-proposals`)).data,
    enabled: !!selectedTreeId && activeType === 'deletions',
  });

  const { data: mergeProposals, isLoading: isLoadingMerge, isError: isErrorMerge, error: errorMerge } = useQuery({
    queryKey: ["tree-merge-proposals", selectedTreeId],
    queryFn: async () => (await api.get(`/trees/${selectedTreeId}/merge-proposals`)).data,
    enabled: !!selectedTreeId && activeType === 'merges',
  });

  const { data: claimRequests, isLoading: isLoadingClaim, isError: isErrorClaim, error: errorClaim } = useQuery({
    queryKey: ["tree-claim-requests", selectedTreeId],
    queryFn: async () => (await api.get(`/trees/${selectedTreeId}/claim-requests`)).data,
    enabled: !!selectedTreeId && activeType === 'claims',
  });

  // Generic Mutation Handler
  const processMutation = useMutation({
    mutationFn: async ({ id, type, action, reason }: { id: string, type: ProposalType, action: 'approve' | 'reject', reason?: string }) => {
      let endpoint = "";
      if (type === 'relationships') endpoint = `/trees/${selectedTreeId}/relationship-proposals/${id}/${action}`;
      if (type === 'deletions') endpoint = `/trees/${selectedTreeId}/deletion-proposals/${id}/${action}`;
      if (type === 'merges') endpoint = `/trees/${selectedTreeId}/merge-proposals/${id}/${action}`;
      if (type === 'claims') endpoint = `/trees/${selectedTreeId}/claim-requests/${id}/${action}`;
      
      return api.post(endpoint, { reason });
    },
    onSuccess: (_, variables) => {
      const keys: Record<ProposalType, string> = {
        relationships: "tree-relationship-proposals",
        deletions: "tree-deletion-proposals",
        merges: "tree-merge-proposals",
        claims: "tree-claim-requests"
      };
      queryClient.invalidateQueries({ queryKey: [keys[variables.type], selectedTreeId] });
      queryClient.invalidateQueries({ queryKey: ["tree-visual", selectedTreeId] });
    },
  });

  const currentProposals = {
    relationships: relProposals,
    deletions: delProposals,
    merges: mergeProposals,
    claims: claimRequests
  }[activeType];

  const status = {
    relationships: { isLoading: isLoadingRel, isError: isErrorRel, error: errorRel },
    deletions: { isLoading: isLoadingDel, isError: isErrorDel, error: errorDel },
    merges: { isLoading: isLoadingMerge, isError: isErrorMerge, error: errorMerge },
    claims: { isLoading: isLoadingClaim, isError: isErrorClaim, error: errorClaim }
  }[activeType];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Tree <span className={theme.colors.accent}>Management</span>
        </h1>
        <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
          Review and verify changes proposed by tree members.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2rem] shadow-xl transition-colors duration-500 bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <GitPullRequest className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Source Workspace</h3>
              <p className="text-slate-300 font-medium">Select the family tree you want to review proposals for.</p>
            </div>
            <div className="relative min-w-[300px]">
              <CustomSelect
                value={selectedTreeId}
                onChange={setSelectedTreeId}
                options={trees?.map((tree: any) => ({ label: `${tree.name} (${tree.role})`, value: tree.id })) || []}
                placeholder="Choose a tree..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit">
        {[
          { id: 'relationships', label: 'Relationships', icon: GitPullRequest },
          { id: 'merges', label: 'Merges', icon: Merge },
          { id: 'claims', label: 'Claims', icon: Fingerprint },
          { id: 'deletions', label: 'Deletions', icon: Trash2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id as ProposalType)}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeType === tab.id 
                ? "bg-white dark:bg-slate-200 shadow-sm text-primary" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <DataState isLoading={status.isLoading} isError={status.isError} error={status.error as Error}>
        <div className="grid grid-cols-1 gap-6">
          {currentProposals?.length > 0 ? (
            currentProposals.map((prop: any) => (
              <motion.div 
                layout
                key={prop.id}
                className={cn("p-8 rounded-[2rem] border shadow-sm hover:shadow-md transition-all flex flex-col items-stretch gap-8", theme.colors.surface, theme.colors.border)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Proposed {formatDate(prop.createdAt)} by {prop.proposerName || prop.proposerEmail || prop.userName || prop.userEmail}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => processMutation.mutate({ id: prop.id, type: activeType, action: 'approve' })}
                      disabled={processMutation.isPending}
                      className={cn(
                        "px-6 py-3 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95 disabled:opacity-50",
                        activeType === 'deletions' ? "bg-red-500 hover:bg-red-600" : theme.colors.primary
                      )}
                    >
                      <Check className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => processMutation.mutate({ id: prop.id, type: activeType, action: 'reject', reason: 'Rejected by admin' })}
                      disabled={processMutation.isPending}
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

                {activeType === 'relationships' && (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4">
                    <ProfileSummary person={prop.fromPerson} label="Subject" theme={theme} />
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn("px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]", theme.colors.primaryMuted, theme.colors.textMuted, theme.colors.border)}>
                        {prop.relationshipType}
                      </div>
                      <ArrowRight className={cn("w-8 h-8 hidden md:block", theme.colors.accent)} />
                    </div>
                    <ProfileSummary person={prop.toPerson} label="Target" theme={theme} />
                  </div>
                )}

                {activeType === 'merges' && (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4">
                    <ProfileSummary person={prop.sourcePerson} label="Source (To be deleted)" theme={theme} isWarning />
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn("px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]", theme.colors.primaryMuted, theme.colors.textMuted, theme.colors.border)}>
                        Merge Into
                      </div>
                      <ArrowRight className={cn("w-8 h-8 hidden md:block", theme.colors.accent)} />
                    </div>
                    <ProfileSummary person={prop.targetPerson} label="Destination (To keep)" theme={theme} />
                  </div>
                )}

                {activeType === 'claims' && (
                  <div className="flex flex-col items-center gap-8 py-4">
                    <div className={cn("w-full max-w-lg p-8 rounded-3xl border-2 flex flex-col items-center text-center gap-6", theme.colors.bg, theme.colors.border)}>
                       <div className="flex items-center gap-6">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
                          <User className={cn("w-8 h-8", theme.colors.accent)} />
                        </div>
                        <div className="text-left">
                          <h4 className={cn("font-black text-2xl", theme.colors.text)}>{prop.person?.firstName} {prop.person?.lastName}</h4>
                          <p className={cn("text-xs font-bold uppercase tracking-widest text-primary")}>Profile being claimed</p>
                        </div>
                       </div>
                       <div className="w-full pt-6 border-t border-dashed" style={{ borderColor: theme.colors.border }}>
                         <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", theme.colors.textMuted)}>Requesting User</p>
                         <p className={cn("font-bold", theme.colors.text)}>{prop.userName}</p>
                         <p className={cn("text-xs", theme.colors.textMuted)}>{prop.userEmail}</p>
                       </div>
                    </div>
                  </div>
                )}

                {activeType === 'deletions' && (
                  <div className="flex flex-col items-center gap-8 py-4">
                    <div className={cn("w-full max-w-lg p-8 rounded-3xl border-2 flex flex-col items-center text-center gap-6", theme.colors.bg, theme.colors.border)}>
                       <div className="flex items-center gap-6">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10")}>
                          <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="text-left">
                          <h4 className={cn("font-black text-2xl", theme.colors.text)}>{prop.person?.firstName} {prop.person?.lastName}</h4>
                          <p className={cn("text-xs font-bold uppercase tracking-widest text-red-500")}>Target for Removal</p>
                        </div>
                       </div>
                       
                       {prop.reason && (
                         <div className={cn("w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 flex gap-3 text-left", theme.colors.border)}>
                           <MessageSquare className="w-4 h-4 mt-0.5 opacity-40 shrink-0" />
                           <p className={cn("text-sm font-medium italic", theme.colors.textMuted)}>{prop.reason}</p>
                         </div>
                       )}

                       <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/5 px-4 py-2 rounded-full">
                         <AlertTriangle className="w-4 h-4" />
                         Approval will permanently remove this profile and all its connections.
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className={cn("border-2 border-dashed rounded-[2rem] p-20 text-center space-y-6 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", theme.colors.bg)}>
                <IconForType type={activeType} theme={theme} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-xl font-bold", theme.colors.text)}>All caught up!</h3>
                <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                  There are no pending {activeType} proposals to review for this tree.
                </p>
              </div>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}

function ProfileSummary({ person, label, theme, isWarning = false }: any) {
  return (
    <div className={cn(
      "w-full md:w-64 p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 transition-colors duration-500", 
      theme.colors.bg, 
      isWarning ? "border-red-200 bg-red-50/30" : theme.colors.border
    )}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isWarning ? "bg-red-500/10" : theme.colors.primaryMuted)}>
        <User className={cn("w-6 h-6", isWarning ? "text-red-500" : theme.colors.accent)} />
      </div>
      <div>
        <h4 className={cn("font-black text-lg", theme.colors.text)}>{person?.firstName} {person?.lastName}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", isWarning ? "text-red-500" : theme.colors.textMuted)}>{label}</p>
      </div>
    </div>
  );
}

function IconForType({ type, theme }: any) {
  if (type === 'relationships') return <GitPullRequest className={cn("w-10 h-10", theme.colors.textMuted)} />;
  if (type === 'deletions') return <Trash2 className={cn("w-10 h-10", theme.colors.textMuted)} />;
  if (type === 'merges') return <Merge className={cn("w-10 h-10", theme.colors.textMuted)} />;
  if (type === 'claims') return <Fingerprint className={cn("w-10 h-10", theme.colors.textMuted)} />;
  return null;
}
