"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { X, Loader2, Link2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/cn";

interface RelationshipProposalModalProps {
  treeId: string;
  onClose: () => void;
  initialFromId?: string;
}

export default function RelationshipProposalModal({ 
  treeId, 
  onClose, 
  initialFromId 
}: RelationshipProposalModalProps) {
  const [fromId, setFromId] = useState(initialFromId || "");
  const [toId, setToId] = useState("");
  const [type, setType] = useState("parent");
  const queryClient = useQueryClient();

  const { data: people, isLoading: isLoadingPeople } = useQuery({
    queryKey: ["tree-people", treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/people`);
      return (res as any).data;
    },
  });

  const proposalMutation = useMutation({
    mutationFn: async (vals: any) => {
      const res = await api.post(`/trees/${treeId}/relationship-proposals`, vals);
      return (res as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-proposals", treeId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId && toId && type) {
      proposalMutation.mutate({
        fromPersonId: fromId,
        toPersonId: toId,
        relationshipType: type
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Propose Relationship</h2>
              <p className="text-sm text-slate-500 font-medium">Link two family members together</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {proposalMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl">
              {(proposalMutation.error as Error).message}
            </div>
          )}

          {fromId && toId && fromId === toId && (
            <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-2xl">
              Subject and target must be different people.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Subject Person</label>
            <select
              required
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">Select person...</option>
              {people?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
              Is the...
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Relationship Type</label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none capitalize"
            >
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
            </select>
          </div>

          <div className="flex justify-center">
            <div className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
              Of...
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Target Person</label>
            <select
              required
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">Select person...</option>
              {people?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={proposalMutation.isPending || !fromId || !toId || fromId === toId}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {proposalMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Proposal"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
