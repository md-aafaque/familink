"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, Shield, Mail, Calendar, UserPlus, ArrowUpRight, Users, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import CustomSelect from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";


export default function ManageUsersPage() {
  const queryClient = useQueryClient();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      const data = (res as any).data;
      const adminTrees = data?.filter((t: any) => t.role === 'admin') || [];
      if (adminTrees.length > 0 && !selectedTreeId) {
        setSelectedTreeId(adminTrees[0].id);
      }
      return adminTrees;
    },
  });

  const { data: requests, isLoading, isError, error } = useQuery({
    queryKey: ["access-requests", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/access-requests`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/trees/${selectedTreeId}/access-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", selectedTreeId] });
    },
  });

  return (
    <div className="relative space-y-6">


      <div className="relative z-10">
        <header className="space-y-4">
          <h1 className={cn("text-4xl font-bold tracking-tight", theme.colors.text)}>
            {t('admin.accessRequests.title')}
          </h1>
          <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
            {t('admin.accessRequests.subtitle')}
          </p>
        </header>

        {/* Tree Selector */}
        <section className="relative mt-8">
          <div className={cn("p-8 rounded-[2rem] shadow-pop-lg transition-colors", "bg-primary")}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">{t('admin.selectTree.title')}</h3>
                <p className="text-primary-foreground/70 font-medium">{t('admin.selectTree.desc')}</p>
              </div>
              <div className="relative min-w-[300px]">
                <CustomSelect
                  value={selectedTreeId}
                  onChange={setSelectedTreeId}
                  options={trees?.map((tree: any) => ({ label: `${tree.name} (${t(`role.${tree.role}` || tree.role)})`, value: tree.id })) || []}
                  placeholder={t('admin.chooseTree')}
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
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10")}>
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className={cn("text-xl font-bold", theme.colors.text)}>{req.userName || t('admin.newUserFallback')}</h3>
                          {req.upgradeFrom && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase tracking-widest border-2 border-primary/20">
                              {t('admin.upgrade')}
                            </span>
                          )}
                        </div>
                        <div className={cn("flex flex-wrap gap-4 text-sm font-medium", theme.colors.textMuted)}>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {req.userEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            <span>
                              {t('admin.requested').split('{role}')[0]}
                              <span className={cn("font-bold capitalize", "text-primary")}>{t(`role.${req.requestedRole}`)}</span>
                              {t('admin.requested').split('{role}')[1]}
                            </span>
                          </div>
                          {req.upgradeFrom && (
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="w-4 h-4" />
                              <span>
                                {t('admin.current').split('{role}')[0]}
                                <span className="capitalize">{t(`role.${req.upgradeFrom}`)}</span>
                                {t('admin.current').split('{role}')[1]}
                              </span>
                            </div>
                          )}
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
                      <Button variant="outline" className="hover:text-destructive hover:border-destructive/30">
                        <X className="w-5 h-5" />
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={cn("border-2 border-dashed rounded-2xl p-20 text-center space-y-6 bg-card")}>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", "bg-muted")}>
                    <UserPlus className={cn("w-10 h-10", "text-muted-foreground")} />
                  </div>
                  <div className="space-y-2">
                    <h3 className={cn("text-xl font-bold", theme.colors.text)}>{t('admin.noRequests.title')}</h3>
                    <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                      {t('admin.noRequests.subtitle')}
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
