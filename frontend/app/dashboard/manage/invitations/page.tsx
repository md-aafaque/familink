"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import {
  Copy,
  Check,
  Plus,
  ExternalLink,
  Shield,
  Users,
  Eye,
  Calendar,
  Clock,
  Link2
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

import { useAppTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";


export default function ManageInvitationsPage() {
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
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

  const { data: invitations, isLoading, isError, error } = useQuery({
    queryKey: ["tree-invitations", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/invitations`);
      return (res as any).activeInvitations;
    },
    enabled: !!selectedTreeId,
  });

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await api.post(`/trees/${selectedTreeId}/invitations/generate`, { role: type });
      return (res as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-invitations", selectedTreeId] });
    },
  });

  const copyToClipboard = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const inviteTypes = [
    { type: 'member', title: t('role.member'), icon: Users, color: 'bg-primary/10 text-primary', desc: t('admin.invitations.desc.member') },
    { type: 'viewer', title: t('role.viewer'), icon: Eye, color: 'bg-muted text-muted-foreground', desc: t('admin.invitations.desc.viewer') },
    { type: 'admin', title: t('role.admin'), icon: Shield, color: cn("bg-primary/20", "text-primary"), desc: t('admin.invitations.desc.admin') },
  ];

  return (
    <div className="relative space-y-6">


      <div className="relative z-10">
        <header className="space-y-4">
          <h1 className={cn("text-4xl font-bold tracking-tight", theme.colors.text)}>
            {t('admin.invitations.title').split(' ')[0]} <span className="text-primary">{t('admin.invitations.title').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
            {t('admin.invitations.subtitle')}
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
                <h3 className="text-2xl font-bold text-white">{t('admin.invitations.targetTree.title')}</h3>
                <p className="text-primary-foreground/70 font-medium max-w-md">
                  {t('admin.invitations.targetTree.desc')}
                </p>
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

        {/* Generate Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {!selectedTreeId && !isLoadingTrees && (
            <div className={cn("md:col-span-3 p-12 rounded-2xl text-center border-2 border-dashed bg-card")}>
              <p className={cn("font-bold italic", "text-muted-foreground")}>{t('admin.invitations.selectToGenerate')}</p>
            </div>
          )}
          {selectedTreeId && inviteTypes.map((item) => (
            <div key={item.type} className={cn("p-8 rounded-2xl border-2 bg-card shadow-pop-sm space-y-6 flex flex-col")}>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", item.color)}>
                <item.icon className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className={cn("text-xl font-bold", theme.colors.text)}>{t('admin.invitations.link').replace('{role}', item.title)}</h3>
                <p className={cn("text-sm leading-relaxed", theme.colors.textMuted)}>{item.desc}</p>
              </div>
              <Button
                variant="candy"
                onClick={() => generateMutation.mutate(item.type)}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                <Plus className="w-4 h-4" />
                {t('admin.invitations.generate')}
              </Button>
            </div>
          ))}
        </section>

        {/* Active Links */}
        <section className="space-y-6 mt-12">
          <h2 className={cn("text-2xl font-bold", theme.colors.text)}>{t('admin.invitations.activeLinks')}</h2>

          {selectedTreeId ? (
            <DataState isLoading={isLoading} isError={isError} error={error as Error}>
              <div className="space-y-4">
                {invitations?.length > 0 ? (
                  invitations.map((inv: any) => (
                    <div key={inv.token} className={cn("p-6 rounded-2xl border-2 bg-card shadow-pop-sm flex flex-col md:flex-row items-center gap-6")}>
                      <div className="flex-1 min-w-0 w-full space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-2",
                            inv.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" :
                              inv.role === 'member' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                          )}>
                            {t(`role.${inv.role}`)}
                          </span>
                          <div className={cn("flex items-center gap-1 text-xs font-medium", theme.colors.textMuted)}>
                            <Clock className="w-3 h-3" />
                            {t('admin.invitations.expires').replace('{date}', new Date(inv.expiresAt).toLocaleDateString())}
                          </div>
                        </div>
                        <div className={cn("flex items-center gap-2 p-3 rounded-2xl border-2 font-mono text-xs truncate", "bg-muted border-border")}>
                          <Link2 className="w-4 h-4 flex-shrink-0" />
                          {inv.invitationUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(inv.invitationUrl, inv.token)}
                        >
                          {copiedToken === inv.token ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                          {copiedToken === inv.token ? t('admin.invitations.copied') : t('admin.invitations.copy')}
                        </Button>
                        <a
                          href={inv.invitationUrl}
                          target="_blank"
                          className={cn("p-3 rounded-xl transition-all border-2 border-border hover:bg-muted")}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={cn("p-12 rounded-2xl text-center border-2 border-dashed bg-card")}>
                    <p className={cn("font-medium italic", "text-muted-foreground")}>{t('admin.invitations.noLinks')}</p>
                  </div>
                )}
              </div>
            </DataState>
          ) : (
            <div className={cn("p-12 rounded-2xl text-center bg-card")}>
              <p className={cn("font-medium italic", "text-muted-foreground")}>{t('admin.invitations.selectToView')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
