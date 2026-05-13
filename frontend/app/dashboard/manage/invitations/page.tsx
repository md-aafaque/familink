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

export default function ManageInvitationsPage() {
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");

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
    { type: 'member', title: 'Member', icon: Users, color: 'bg-blue-100 text-blue-600', desc: 'Can add people and propose relationships.' },
    { type: 'viewer', title: 'Viewer', icon: Eye, color: 'bg-slate-100 text-slate-600', desc: 'Read-only access to the family tree.' },
    { type: 'admin', title: 'Admin', icon: Shield, color: 'bg-orange-100 text-orange-600', desc: 'Full control over tree and invitations.' },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Tree <span className="text-orange-600">Invitations</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Create secure links to invite your relatives. Each link is valid for 7 days and requires your approval before they can join.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className="bg-linear-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-xl overflow-hidden">
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
                className="w-full pl-6 pr-12 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-white focus:ring-4 focus:ring-orange-500/30 outline-none appearance-none transition-all cursor-pointer backdrop-blur-md"
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
          <div className="md:col-span-3 p-12 bg-amber-50 border border-amber-100 rounded-[2.5rem] text-center">
            <p className="text-amber-700 font-bold italic">You must have or be an admin of at least one family tree to generate invitations.</p>
          </div>
        )}
        {selectedTreeId && inviteTypes.map((item) => (
          <div key={item.type} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 flex flex-col">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", item.color)}>
              <item.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-slate-900">{item.title} Link</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
            <button
              onClick={() => generateMutation.mutate(item.type)}
              disabled={generateMutation.isPending}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>
        ))}
      </section>

      {/* Active Links */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Links</h2>
        
        {selectedTreeId ? (
          <DataState isLoading={isLoading} isError={isError} error={error as Error}>
            <div className="space-y-4">
              {invitations?.length > 0 ? (
                invitations.map((inv: any) => (
                <div key={inv.token} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 min-w-0 w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        inv.invitationType === 'admin' ? "bg-orange-100 text-orange-700" : 
                        inv.invitationType === 'member' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {inv.invitationType}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600 truncate">
                      <Link2 className="w-4 h-4 flex-shrink-0" />
                      {inv.invitationUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => copyToClipboard(inv.invitationUrl, inv.token)}
                      className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {copiedToken === inv.token ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copiedToken === inv.token ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={inv.invitationUrl}
                      target="_blank"
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 bg-slate-50 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">No active invitation links for this tree. Generate one above.</p>
              </div>
            )}
          </div>
        </DataState>
        ) : (
          <div className="p-12 bg-slate-50 rounded-[2.5rem] text-center">
             <p className="text-slate-400 font-medium italic">Select a tree above to view active invitations.</p>
          </div>
        )}
      </section>
    </div>
  );
}
