"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, Shield, Mail, Calendar, UserPlus, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export default function ManageUsersPage() {
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
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Access <span className="text-orange-600">Requests</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Manage who can join your family tree and their permission levels. 
          New members and role upgrades appear here.
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
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">{req.userName || 'New User'}</h3>
                      {req.upgradeFrom && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                          Upgrade
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {req.userEmail}
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Requested: <span className="text-slate-900 font-bold capitalize">{req.requestedRole}</span>
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
                    className="flex-1 md:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
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
                <UserPlus className="w-10 h-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">No pending requests</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
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
