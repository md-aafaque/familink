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
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";


type ProposalType = 'relationships' | 'deletions' | 'merges' | 'claims';
import { useSearchParams, useRouter } from "next/navigation";

// ... inside ManageProposalsPage
export default function ManageProposalsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const activeType = (searchParams.get('tab') as ProposalType) || 'relationships';

  const setActiveType = (tab: ProposalType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      const data = (res as any).data;
      return data?.filter((t: any) => t.role === 'admin') || [];
    },
  });

  useEffect(() => {
    if (trees?.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

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
    queryKey: ["tree-claims", selectedTreeId],
    queryFn: async () => (await api.get(`/trees/${selectedTreeId}/claims`)).data,
    enabled: !!selectedTreeId && activeType === 'claims',
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, type, action, reason }: { id: string, type: ProposalType, action: 'approve' | 'reject', reason?: string }) => {
      let endpoint = "";
      if (type === 'relationships') endpoint = `/trees/${selectedTreeId}/relationship-proposals/${id}/${action}`;
      if (type === 'deletions') endpoint = `/trees/${selectedTreeId}/deletion-proposals/${id}/${action}`;
      if (type === 'merges') endpoint = `/trees/${selectedTreeId}/merge-proposals/${id}/${action}`;
      if (type === 'claims') endpoint = `/trees/${selectedTreeId}/claims/${id}/${action}`;
      return api.post(endpoint, { reason });
    },
    onSuccess: (_, variables) => {
      const keys: Record<ProposalType, string> = {
        relationships: "tree-relationship-proposals",
        deletions: "tree-deletion-proposals",
        merges: "tree-merge-proposals",
        claims: "tree-claims"
      };
      queryClient.invalidateQueries({ queryKey: [keys[variables.type], selectedTreeId] });
      queryClient.invalidateQueries({ queryKey: ["tree-visual", selectedTreeId] });
    },
  });

  const currentProposals = { relationships: relProposals, deletions: delProposals, merges: mergeProposals, claims: claimRequests }[activeType];
  const status = { relationships: { isLoading: isLoadingRel, isError: isErrorRel, error: errorRel }, deletions: { isLoading: isLoadingDel, isError: isErrorDel, error: errorDel }, merges: { isLoading: isLoadingMerge, isError: isErrorMerge, error: errorMerge }, claims: { isLoading: isLoadingClaim, isError: isErrorClaim, error: errorClaim } }[activeType];

  return (
    <div className="relative space-y-6">


      <div className="relative z-10">
        <header className="space-y-4">
          <h1 className={cn("text-4xl font-bold tracking-tight", theme.colors.text)}>
            {activeType === 'relationships' && <><span className="text-primary">{t('header.relationshipProposals').split(' ')[0]}</span> {t('header.relationshipProposals').split(' ').slice(1).join(' ')}</>}
            {activeType === 'merges' && <><span className="text-primary">{t('nav.mergeRequests').split(' ')[0]}</span> {t('nav.mergeRequests').split(' ').slice(1).join(' ')}</>}
            {activeType === 'claims' && <><span className="text-primary">{t('admin.claims.title').split(' ')[0]}</span> {t('admin.claims.title').split(' ').slice(1).join(' ')}</>}
            {activeType === 'deletions' && <><span className="text-primary">{t('nav.deletionRequests').split(' ')[0]}</span> {t('nav.deletionRequests').split(' ').slice(1).join(' ')}</>}
          </h1>
          <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
            {activeType === 'relationships' && t('admin.management.subtitle')}
            {activeType === 'merges' && t('admin.management.subtitle')}
            {activeType === 'claims' && t('admin.claims.subtitle')}
            {activeType === 'deletions' && t('admin.management.subtitle')}
          </p>
        </header>

        {/* Tree Selector */}
        <section className="relative mt-8">
          <div className={cn("p-8 rounded-[2rem] shadow-pop-lg transition-colors", "bg-primary")}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <GitPullRequest className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">{t('admin.management.sourceWorkspace.title')}</h3>
                <p className="text-primary-foreground/70 font-medium">{t('admin.management.sourceWorkspace.desc')}</p>
              </div>
              <div className="relative min-w-[300px]">
                <CustomSelect
                  value={selectedTreeId}
                  onChange={setSelectedTreeId}
                  options={trees?.map((tree: any) => ({ label: `${tree.name} (${tree.role})`, value: tree.id })) || []}
                  placeholder={t('admin.chooseTree')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-muted border-2 border-border w-fit mt-8">
          {[
            { id: 'relationships', label: t('admin.management.tab.relationships'), icon: GitPullRequest },
            { id: 'merges', label: t('admin.management.tab.merges'), icon: Merge },
            { id: 'claims', label: t('admin.management.tab.claims'), icon: Fingerprint },
            { id: 'deletions', label: t('admin.management.tab.deletions'), icon: Trash2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id as ProposalType)}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2 border-transparent",
                activeType === tab.id
                  ? "bg-primary text-primary-foreground shadow-pop-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <DataState isLoading={status.isLoading} isError={status.isError} error={status.error as Error}>
            <div className="grid grid-cols-1 gap-6">
              {currentProposals?.length > 0 ? (
                currentProposals.map((prop: any) => (
                  <motion.div
                    layout
                    key={prop.id}
                    className={cn("p-8 rounded-2xl border-2 bg-card shadow-pop-sm hover:shadow-pop-lg transition-all flex flex-col items-stretch gap-8")}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {t('admin.management.proposed')
                          .replace('{date}', formatDate(prop.createdAt))
                          .replace('{user}', prop.proposerName || prop.proposerEmail || prop.userName || prop.userEmail)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={activeType === 'deletions' ? 'destructive' : 'candy'}
                          onClick={() => processMutation.mutate({ id: prop.id, type: activeType, action: 'approve' })}
                          disabled={processMutation.isPending}
                        >
                          <Check className="w-5 h-5" />
                          {t('admin.approve')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => processMutation.mutate({ id: prop.id, type: activeType, action: 'reject', reason: t('admin.management.defaultRejectReason') })}
                          disabled={processMutation.isPending}
                          className="hover:text-destructive hover:border-destructive/30"
                        >
                          <X className="w-5 h-5" />
                          {t('admin.reject')}
                        </Button>
                      </div>
                    </div>

                    {activeType === 'relationships' && (
                      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4">
                        <ProfileSummary person={prop.fromPerson} label={t('admin.management.label.subject')} theme={theme} />
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn("px-6 py-2 rounded-full border-2 text-[10px] font-bold uppercase tracking-[0.2em]", "bg-primary/5 text-muted-foreground border-primary/20")}>
                            {prop.relationshipType}
                          </div>
                          <ArrowRight className={cn("w-8 h-8 hidden md:block", "text-primary")} />
                        </div>
                        <ProfileSummary person={prop.toPerson} label={t('admin.management.label.target')} theme={theme} />
                      </div>
                    )}

                    {activeType === 'merges' && (
                      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4">
                        <ProfileSummary person={prop.sourcePerson} label={t('admin.management.label.source')} theme={theme} isWarning />
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn("px-6 py-2 rounded-full border-2 text-[10px] font-bold uppercase tracking-[0.2em]", "bg-primary/5 text-muted-foreground border-primary/20")}>
                            {t('admin.management.mergeInto')}
                          </div>
                          <ArrowRight className={cn("w-8 h-8 hidden md:block", "text-primary")} />
                        </div>
                        <ProfileSummary person={prop.targetPerson} label={t('admin.management.label.destination')} theme={theme} />
                      </div>
                    )}

                    {activeType === 'claims' && (
                      <div className="flex flex-col items-center gap-8 py-4">
                        <div className={cn("w-full max-w-lg p-8 rounded-2xl border-2 flex flex-col items-center text-center gap-6", "bg-card border-border")}>
                          <div className="flex items-center gap-6">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", "bg-primary/10")}>
                              <User className={cn("w-8 h-8", "text-primary")} />
                            </div>
                            <div className="text-left">
                              <h4 className={cn("font-bold text-2xl", theme.colors.text)}>{prop.person?.firstName} {prop.person?.lastName}</h4>
                              <p className={cn("text-xs font-bold uppercase tracking-widest", "text-primary")}>{t('admin.management.profileClaimed')}</p>
                            </div>
                          </div>
                          <div className="w-full pt-6 border-t border-dashed border-border">
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", theme.colors.textMuted)}>{t('admin.management.requestingUser')}</p>
                            <p className={cn("font-bold", theme.colors.text)}>{prop.userName}</p>
                            <p className={cn("text-xs", theme.colors.textMuted)}>{prop.userEmail}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeType === 'deletions' && (
                      <div className="flex flex-col items-center gap-8 py-4">
                        <div className={cn("w-full max-w-lg p-8 rounded-2xl border-2 flex flex-col items-center text-center gap-6", "bg-card border-destructive/20")}>
                          <div className="flex items-center gap-6">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", "bg-destructive/10")}>
                              <Trash2 className="w-8 h-8 text-destructive" />
                            </div>
                            <div className="text-left">
                              <h4 className={cn("font-bold text-2xl", theme.colors.text)}>{prop.person?.firstName} {prop.person?.lastName}</h4>
                              <p className={cn("text-xs font-bold uppercase tracking-widest", "text-destructive")}>{t('admin.management.targetRemoval')}</p>
                            </div>
                          </div>

                          {prop.reason && (
                            <div className={cn("w-full p-4 rounded-2xl border-2 flex gap-3 text-left", "bg-muted border-border")}>
                              <MessageSquare className="w-4 h-4 mt-0.5 opacity-40 shrink-0" />
                              <p className={cn("text-sm font-medium italic", theme.colors.textMuted)}>{prop.reason}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/5 px-4 py-2 rounded-full border-2 border-destructive/20">
                            <AlertTriangle className="w-4 h-4" />
                            {t('admin.management.deletionWarning')}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className={cn("border-2 border-dashed rounded-2xl p-20 text-center space-y-6", "bg-card")}>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", "bg-muted")}>
                    <IconForType type={activeType} theme={theme} />
                  </div>
                  <div className="space-y-2">
                    <h3 className={cn("text-xl font-bold", theme.colors.text)}>{t('admin.management.allCaughtUp')}</h3>
                    <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                      {t('admin.management.noProposals').replace('{type}', t(`admin.management.tab.${activeType}`))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DataState>
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({ person, label, theme, isWarning = false }: any) {
  return (
    <div className={cn(
      "w-full md:w-64 p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-3",
      "bg-card",
      isWarning ? "border-destructive/20 bg-destructive/5" : "border-border"
    )}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isWarning ? "bg-destructive/10" : "bg-primary/10")}>
        <User className={cn("w-6 h-6", isWarning ? "text-destructive" : "text-primary")} />
      </div>
      <div>
        <h4 className={cn("font-bold text-lg", theme.colors.text)}>{person?.firstName} {person?.lastName}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", isWarning ? "text-destructive" : "text-muted-foreground")}>{label}</p>
      </div>
    </div>
  );
}

function IconForType({ type, theme }: any) {
  if (type === 'relationships') return <GitPullRequest className={cn("w-10 h-10", "text-muted-foreground")} />;
  if (type === 'deletions') return <Trash2 className={cn("w-10 h-10", "text-muted-foreground")} />;
  if (type === 'merges') return <Merge className={cn("w-10 h-10", "text-muted-foreground")} />;
  if (type === 'claims') return <Fingerprint className={cn("w-10 h-10", "text-muted-foreground")} />;
  return null;
}
