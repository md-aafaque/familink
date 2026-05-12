"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { Check, X, User, ArrowRight, Calendar, Mail, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export default function ManageProposalsPage() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch trees first to get a list
  const { data: trees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

  // For now, pick the first tree where user is admin
  const selectedTreeId = trees?.find((t: any) => t.role === 'admin')?.id || trees?.[0]?.id;

  const { data: proposals, isLoading, isError, error } = useQuery({
    queryKey: ["tree-proposals", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/relationship-proposals`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const approveMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/trees/${selectedTreeId}/relationship-proposals/${proposalId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-proposals", selectedTreeId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string, reason: string }) => {
      await api.post(`/trees/${selectedTreeId}/relationship-proposals/${proposalId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-proposals", selectedTreeId] });
      setRejectingId(null);
      setRejectReason("");
    },
  });

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Relationship <span className="text-blue-600">Proposals</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Review and approve family connections proposed by members. 
          Ensuring data integrity is key to a healthy family tree.
        </p>
      </header>

      {!selectedTreeId && !isLoading && (
        <div className="p-8 bg-orange-50 border border-orange-100 rounded-[2.5rem] flex items-center gap-4 text-orange-800">
           <AlertCircle className="w-6 h-6" />
           <p className="font-bold">Please select a family tree to manage proposals.</p>
        </div>
      )}

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        <div className="grid grid-cols-1 gap-6">
          {proposals?.length > 0 ? (
            proposals.map((prop: any) => (
              <motion.div 
                layout
                key={prop.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-6"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject</p>
                        <p className="font-bold text-slate-900">{prop.fromPerson.firstName} {prop.fromPerson.lastName}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                       <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                         {prop.relationshipType}
                       </span>
                       <ArrowRight className="w-4 h-4 text-slate-300 mt-1" />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Target</p>
                        <p className="font-bold text-slate-900">{prop.toPerson.firstName} {prop.toPerson.lastName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {rejectingId === prop.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          placeholder="Reason for rejection..."
                          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button 
                          onClick={() => rejectMutation.mutate({ proposalId: prop.id, reason: rejectReason })}
                          disabled={!rejectReason || rejectMutation.isPending}
                          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setRejectingId(null)}
                          className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(prop.id)}
                          disabled={approveMutation.isPending}
                          className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(prop.id)}
                          className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-6 items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-4 h-4" />
                    <span>Proposed by <strong>{prop.proposerEmail}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(prop.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 text-center space-y-4">
              <Check className="w-16 h-16 text-green-500 mx-auto opacity-20" />
              <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
              <p className="text-slate-500">There are no pending relationship proposals to review.</p>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
