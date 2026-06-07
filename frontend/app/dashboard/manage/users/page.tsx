"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, Shield, Mail, Calendar, UserPlus, ArrowUpRight, Users, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import CustomSelect from "@/components/ui/CustomSelect";

export default function ManageUsersPage() {
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
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Access <span className={theme.colors.accent}>Requests</span>
        </h1>
        <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
          Manage who can join your family tree and their permission levels. 
          New members and role upgrades appear here.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2rem] shadow-xl transition-colors duration-500", theme.isDark ? "bg-slate-900" : "bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Shield className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Select Tree</h3>
              <p className="text-slate-300 font-medium">Manage members for the selected workspace</p>
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

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        <div className="grid grid-cols-1 gap-6">
          {requests?.length > 0 ? (
            requests.map((req: any) => (
              <motion.div 
                layout
                key={req.id}
                className={cn("p-8 rounded-[2rem] border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-8", theme.colors.surface, theme.colors.border)}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
                    <User className={cn("w-8 h-8", theme.colors.accent)} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className={cn("text-xl font-bold", theme.colors.text)}>{req.userName || 'New User'}</h3>
                      {req.upgradeFrom && (
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-violet-500/20">
                          Upgrade
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
                        Requested: <span className={cn("font-bold capitalize", theme.colors.text)}>{req.requestedRole}</span>
                      </div>
                      {req.upgradeFrom && (
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="w-4 h-4" />
                          Current: <span className="capitalize">{req.upgradeFrom}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={approveMutation.isPending}
                    className={cn(
                      "flex-1 md:flex-none px-8 py-3 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-black/5",
                      theme.colors.primary
                    )}
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    className={cn(
                      "flex-1 md:flex-none px-8 py-3 border rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95",
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
              </motion.div>
            ))
          ) : (
            <div className={cn("border-2 border-dashed rounded-[2rem] p-20 text-center space-y-6 transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", theme.colors.bg)}>
                <UserPlus className={cn("w-10 h-10", theme.colors.textMuted)} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-xl font-bold", theme.colors.text)}>No pending requests</h3>
                <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                  When new family members ask to join your tree, they will show up here for approval.
                </p>
              </div>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
