"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, Shield, Mail, Calendar, Fingerprint, Users } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import { formatDate } from "@/lib/dateUtils";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";


export default function ManageClaimsPage() {
  const queryClient = useQueryClient();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

  useEffect(() => {
    if (trees?.length > 0 && !selectedTreeId) {
      const adminTree = trees.find((t: any) => t.role === 'admin');
      setSelectedTreeId(adminTree?.id || trees[0].id);
    }
  }, [trees, selectedTreeId]);

  const { data: requests, isLoading, isError, error } = useQuery({
    queryKey: ["claims", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/claims`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/trees/${selectedTreeId}/claims/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims", selectedTreeId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/trees/${selectedTreeId}/claims/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims", selectedTreeId] });
    },
  });

  return (
    <div className="relative space-y-6">


      <div className="relative z-10">
        <header className="space-y-4">
          <h1 className={cn("text-4xl font-bold tracking-tight", theme.colors.text)}>
            {t('admin.claims.title').split(' ')[0]} <span className="text-primary">{t('admin.claims.title').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
            {t('admin.claims.subtitle')}
          </p>
        </header>

        {/* Tree Selector */}
        <section className="relative mt-8">
          <div className={cn("p-8 rounded-[2rem] shadow-pop-lg transition-colors", "bg-primary")}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Fingerprint className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">{t('admin.claims.selectTree.title')}</h3>
                <p className="text-primary-foreground/70 font-medium">{t('admin.claims.selectTree.desc')}</p>
              </div>
              <div className="relative min-w-[300px]">
                <CustomSelect
                  value={selectedTreeId}
                  onChange={setSelectedTreeId}
                  options={trees?.map((tree: any) => ({ label: `${tree.name} (${tree.role})`, value: tree.id })) || []}
                  placeholder={t('admin.claims.chooseTree')}
                  className="w-full md:min-w-[300px]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <DataState isLoading={isLoading} isError={isError} error={error as Error}>
            <div className="grid grid-cols-1 gap-6">
              {requests?.length > 0 ? (
                requests.map((req: any) => (
                  <motion.div
                    layout
                    key={req.id}
                    className={cn("p-8 rounded-2xl border-2 bg-card shadow-pop-sm hover:shadow-pop-lg transition-all flex flex-col md:flex-row items-center justify-between gap-8")}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", "bg-primary/10")}>
                        <Fingerprint className={cn("w-8 h-8", "text-primary")} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className={cn("text-xl font-bold", theme.colors.text)}>{req.userName}</h3>
                          <span className={"text-muted-foreground"}>{t('admin.claims.wantsToClaim')}</span>
                          <h3 className={cn("text-xl font-bold", "text-primary")}>{req.person.firstName} {req.person.lastName}</h3>
                        </div>
                        <div className={cn("flex flex-wrap gap-4 text-sm font-medium", theme.colors.textMuted)}>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {req.userEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {t('admin.claims.requested').replace('{date}', formatDate(req.createdAt))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button
                        variant="candy"
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-5 h-5" />
                        {t('admin.approve')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectMutation.mutate(req.id)}
                        disabled={rejectMutation.isPending}
                        className="hover:text-destructive hover:border-destructive/30"
                      >
                        <X className="w-5 h-5" />
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={cn("border-2 border-dashed rounded-2xl p-20 text-center space-y-6", "bg-card")}>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", "bg-muted")}>
                    <Fingerprint className={cn("w-10 h-10", "text-muted-foreground")} />
                  </div>
                  <div className="space-y-2">
                    <h3 className={cn("text-xl font-bold", theme.colors.text)}>{t('admin.claims.noRequests.title')}</h3>
                    <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                      {t('admin.claims.noRequests.subtitle')}
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
