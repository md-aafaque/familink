"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { ArrowLeft, Users, User, Plus, X, Link2 } from 'lucide-react';
import DataState from '../../../components/shared/DataState';
import { useState } from 'react';
import PersonForm from '../../../components/PersonForm';
import RelationshipProposalModal from '../../../components/RelationshipProposalModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/cn';

import dynamic from 'next/dynamic';

const FamilyTreeContainer = dynamic(() => import('../../../components/tree/FamilyTreeContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[700px] bg-slate-50 rounded-[3rem] border border-slate-200 animate-pulse">
      <Loader2 className="w-12 h-12 text-orange-200 animate-spin" />
    </div>
  ),
});

import { LayoutGrid, List, Loader2 } from 'lucide-react';

export default function TreePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', id],
    queryFn: async () => {
      const response = await api.get(`/trees/${id}`);
      return (response as any).data;
    },
    enabled: !!id,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tree-neighborhood', id],
    queryFn: async () => {
      const response = await api.get(`/trees/${id}/neighborhood`);
      return (response as any).data;
    },
    enabled: !!id,
  });

  const userRole = treeData?.role || 'viewer';
  const isViewer = userRole === 'viewer';

  const createMutation = useMutation({
    mutationFn: async (vals: any) => {
      console.log("MUTATION PAYLOAD:", vals);

      const token = localStorage.getItem("token");

      const res = await api.post(
        `/trees/${id}/people`,
        vals,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log("CREATE RESPONSE:", res.data);

      return (res as any).data;
    },

    onSuccess: () => {
      // console.log("CREATE SUCCESS");

      queryClient.invalidateQueries({
        queryKey: ["tree-neighborhood", id],
      });

      setIsAdding(false);
    },

    onError: (err: any) => {
      console.error("CREATE ERROR:", err);
    },
  });

  const personCount = data ? 1 + (data.level1?.length || 0) + (data.level2?.length || 0) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <h1>Family Tree</h1>
          <div className="flex items-center gap-3">
            {!isViewer && (
              <>
                <button
                  onClick={() => setIsProposing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Link2 className="w-5 h-5 text-blue-600" />
                  Propose Relationship
                </button>
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                >
                  <Plus className="w-5 h-5" />
                  Add Family Member
                </button>
              </>
            )}
            {isViewer && (
              <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold border border-slate-200">
                View Only Access
              </span>
            )}
          </div>
        </div>
        <DataState isLoading={isLoading} isError={isError} error={error as Error}>
          <p className="text-slate-600 mt-1">{personCount} family members found</p>
        </DataState>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
          <button
            onClick={() => setViewMode('visual')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              viewMode === 'visual' ? "bg-orange-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Tree View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              viewMode === 'list' ? "bg-orange-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'visual' ? (
          <motion.div
            key="visual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FamilyTreeContainer treeId={id} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DataState isLoading={isLoading} isError={isError} error={error as Error}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Re-using raw visual data for list view since it has everyone */}
                {data && (
                  <>
                    <div className="card border-orange-200 bg-orange-50/30">
                      <h3 className="text-xs font-black uppercase text-orange-600 mb-4 tracking-widest">Selected Member</h3>
                      <Link href={`/person/${data.person.id}`} className="group block">
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                          {data.person.firstName} {data.person.lastName}
                        </h4>
                        <p className="text-xs text-slate-500">You</p>
                      </Link>
                    </div>
                    {data.level1?.map((p: any) => (
                      <div key={p.id} className="card hover:border-orange-200 transition-all">
                        <Link href={`/person/${p.id}`} className="group block">
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                            {p.firstName} {p.lastName}
                          </h4>
                          <p className="text-xs text-slate-500">Direct Relation</p>
                        </Link>
                      </div>
                    ))}
                    {data.level2?.map((p: any) => (
                      <div key={p.id} className="card opacity-80 hover:opacity-100 transition-all">
                        <Link href={`/person/${p.id}`} className="group block">
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                            {p.firstName} {p.lastName}
                          </h4>
                          <p className="text-xs text-slate-500">Extended Family</p>
                        </Link>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </DataState>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship Proposal Modal */}
      <AnimatePresence>
        {isProposing && (
          <RelationshipProposalModal 
            treeId={id} 
            onClose={() => setIsProposing(false)} 
          />
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-orange-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Add Family Member</h2>
                    <p className="text-sm text-slate-500 font-medium">Create a new profile in this tree</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <PersonForm 
                  treeId={id}
                  onSubmit={(vals) => createMutation.mutate(vals)} 
                  isLoading={createMutation.isPending} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
