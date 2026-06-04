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
  Link2,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

import { useAppTheme } from "@/components/providers/ThemeProvider";

export default function ManageInvitationsPage() {
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const { theme } = useAppTheme();

  // Fetch trees first to get a list
  const { data: trees, isLoading: isLoadingTrees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
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
      const res = await api.post(`/trees/${selectedTreeId}/invitations`, { invitationType: type });
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
    { type: 'member', title: 'Member', icon: Users, color: 'bg-violet-500/10 text-violet-600', desc: 'Can add people and propose relationships.' },
    { type: 'viewer', title: 'Viewer', icon: Eye, color: 'bg-slate-500/10 text-slate-600', desc: 'Read-only access to the family tree.' },
    { type: 'admin', title: 'Admin', icon: Shield, color: cn(theme.colors.primaryMuted, theme.colors.accent), desc: 'Full control over tree and invitations.' },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Tree <span className={theme.colors.accent}>Invitations</span>
        </h1>
        <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
          Create secure links to invite your relatives. Each link is valid for 7 days and requires your approval before they can join.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2rem] shadow-xl overflow-hidden transition-colors duration-500", theme.isDark ? "bg-slate-900" : "bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Shield className="w-32 h-32 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Target Family Tree</h3>
              <p className="text-slate-300 font-medium max-w-md">
                Select which family workspace you want to create secure invitation links for.
              </p>
            </div>
            
            <div className="relative min-w-[300px]">
              <select
                value={selectedTreeId}
                onChange={(e) => setSelectedTreeId(e.target.value)}
                className="w-full pl-6 pr-12 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-white focus:ring-4 focus:ring-primary/30 outline-none appearance-none transition-all cursor-pointer backdrop-blur-md"
              >
                <option value="" className="text-slate-900">Choose a tree...</option>
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

      {/* Generate Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!selectedTreeId && !isLoadingTrees && (
          <div className={cn("md:col-span-3 p-12 rounded-[2rem] text-center border-2 border-dashed transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
            <p className={cn("font-bold italic", theme.colors.textMuted)}>Select a tree above to generate invitations.</p>
          </div>
        )}
        {selectedTreeId && inviteTypes.map((item) => (
          <div key={item.type} className={cn("p-8 rounded-[2rem] border shadow-sm space-y-6 flex flex-col transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", item.color)}>
              <item.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className={cn("text-xl font-bold", theme.colors.text)}>{item.title} Link</h3>
              <p className={cn("text-sm leading-relaxed", theme.colors.textMuted)}>{item.desc}</p>
            </div>
            <button
              onClick={() => generateMutation.mutate(item.type)}
              disabled={generateMutation.isPending}
              className={cn(
                "w-full py-3 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95",
                theme.colors.primary
              )}
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>
        ))}
      </section>

      {/* Active Links */}
      <section className="space-y-6">
        <h2 className={cn("text-2xl font-bold", theme.colors.text)}>Active Links</h2>
        
        {selectedTreeId ? (
          <DataState isLoading={isLoading} isError={isError} error={error as Error}>
            <div className="space-y-4">
              {invitations?.length > 0 ? (
                invitations.map((inv: any) => (
                <div key={inv.token} className={cn("p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                  <div className="flex-1 min-w-0 w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        inv.invitationType === 'admin' ? cn(theme.colors.primaryMuted, theme.colors.accent) : 
                        inv.invitationType === 'member' ? "bg-violet-500/10 text-violet-600" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {inv.invitationType}
                      </span>
                      <div className={cn("flex items-center gap-1 text-xs font-medium", theme.colors.textMuted)}>
                        <Clock className="w-3 h-3" />
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2 p-3 rounded-2xl border font-mono text-xs truncate transition-colors duration-500", theme.colors.bg, theme.colors.border, theme.colors.textMuted)}>
                      <Link2 className="w-4 h-4 flex-shrink-0" />
                      {inv.invitationUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => copyToClipboard(inv.invitationUrl, inv.token)}
                      className={cn(
                        "flex-1 md:flex-none px-6 py-3 border rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95",
                        theme.colors.bg,
                        theme.colors.border,
                        theme.colors.text
                      )}
                    >
                      {copiedToken === inv.token ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copiedToken === inv.token ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={inv.invitationUrl}
                      target="_blank"
                      className={cn("p-3 rounded-2xl transition-all", theme.colors.bg, theme.colors.textMuted, "hover:" + theme.colors.text)}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className={cn("p-12 rounded-[2rem] text-center border-2 border-dashed transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                <p className={cn("font-medium italic", theme.colors.textMuted)}>No active invitation links for this tree. Generate one above.</p>
              </div>
            )}
          </div>
        </DataState>
        ) : (
          <div className={cn("p-12 rounded-[2rem] text-center transition-colors duration-500", theme.colors.surface)}>
             <p className={cn("font-medium italic", theme.colors.textMuted)}>Select a tree above to view active invitations.</p>
          </div>
        )}
      </section>
    </div>
  );
}
