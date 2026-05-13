"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, Shield, Mail, Calendar, Fingerprint, ChevronDown, Users } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ManageClaimsPage() {
  const queryClient = useQueryClient();
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");

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
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Profile <span className="text-blue-600">Claims</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Review requests from users who want to link their account to an existing profile in the family tree.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className="bg-linear-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Fingerprint className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Select Tree</h3>
              <p className="text-slate-300 font-medium">Review claims for the selected workspace</p>
            </div>
            <div className="relative min-w-[300px]">
              <select
                value={selectedTreeId}
                onChange={(e) => setSelectedTreeId(e.target.value)}
                className="w-full pl-6 pr-12 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-white focus:ring-4 focus:ring-blue-500/30 outline-none appearance-none transition-all cursor-pointer backdrop-blur-md"
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
          {requests?.length > 0 ? (
            requests.map((req: any) => (
              <motion.div 
                layout
                key={req.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-8"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Fingerprint className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">{req.userName}</h3>
                      <span className="text-slate-400">wants to claim</span>
                      <h3 className="text-xl font-bold text-orange-600">{req.person.firstName} {req.person.lastName}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
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
                    className="flex-1 md:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 md:flex-none px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Fingerprint className="w-10 h-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">No pending claim requests</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
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
