"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, Shield, Mail, Calendar, UserPlus, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

export default function ManageClaimsPage() {
  const queryClient = useQueryClient();

  // Fetch trees first to get a list
  const { data: trees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

  const selectedTreeId = trees?.find((t: any) => t.role === 'admin')?.id || trees?.[0]?.id;

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
                    <div className="flex items-center gap-3">
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
                        Requested {new Date(req.createdAt).toLocaleDateString()}
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
