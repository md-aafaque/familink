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

export default function ManageClaimsPage() {
  const queryClient = useQueryClient();
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

  // Initialize selectedTreeId
  useEffect(() => {
    if (trees?.length > 0 && !selectedTreeId) {
      const adminTree = trees.find((t: any) => t.role === 'admin');
      setSelectedTreeId(adminTree?.id || trees[0].id);
    }
  }, [trees, selectedTreeId]);

  const { data: requests, isLoading, isError, error } = useQuery({
    queryKey: ["claim-requests", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/claim-requests`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/trees/${selectedTreeId}/claim-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim-requests", selectedTreeId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/trees/${selectedTreeId}/claim-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim-requests", selectedTreeId] });
    },
  });

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Profile <span className={theme.colors.accent}>Claims</span>
        </h1>
        <p className={cn("text-lg max-w-2xl font-medium", theme.colors.textMuted)}>
          Review requests from users who want to link their account to an existing profile in the family tree.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2rem] shadow-xl transition-colors duration-500", theme.isDark ? "bg-slate-900" : "bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Fingerprint className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Select Tree</h3>
              <p className="text-slate-300 font-medium">Review claims for the selected workspace</p>
            </div>
            <div className="relative min-w-[300px]">
              <CustomSelect
                value={selectedTreeId}
                onChange={setSelectedTreeId}
                options={trees?.map((tree: any) => ({ label: `${tree.name} (${tree.role})`, value: tree.id })) || []}
                placeholder="Choose a tree..."
                className="w-full md:min-w-[300px]"
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
                    <Fingerprint className={cn("w-8 h-8", theme.colors.accent)} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className={cn("text-xl font-bold", theme.colors.text)}>{req.userName}</h3>
                      <span className={theme.colors.textMuted}>wants to claim</span>
                      <h3 className={cn("text-xl font-bold", theme.colors.accent)}>{req.person.firstName} {req.person.lastName}</h3>
                    </div>
                    <div className={cn("flex flex-wrap gap-4 text-sm font-medium", theme.colors.textMuted)}>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {req.userEmail}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Requested {formatDate(req.createdAt)}
                      </div>
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
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
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
                <Fingerprint className={cn("w-10 h-10", theme.colors.textMuted)} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-xl font-bold", theme.colors.text)}>No pending claim requests</h3>
                <p className={cn("max-w-sm mx-auto font-medium", theme.colors.textMuted)}>
                  When users request to claim a profile in your tree, they will show up here for verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
