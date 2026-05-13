"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import DataState from "../../../components/shared/DataState";
import PersonForm from "../../../components/PersonForm";
import { 
  ArrowLeft, 
  Trash2, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dateUtils";

export default function PersonProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["person", id],
    queryFn: async () => {
      const res = await api.get(`/people/${id}`);
      return (res as any).data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      const res = await api.patch(`/people/${id}`, input);
      return (res as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", id] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/people/${id}`);
    },
    onSuccess: () => {
      router.back();
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this profile? This action is reversible by an admin.")) {
      deleteMutation.mutate();
    }
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/people/${id}/claim`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", id] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3">
          {!isEditing && (
            <>
              {data?.status === 'ghost' && (
                <button
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {claimMutation.isPending ? "Claiming..." : "This is Me (Claim Profile)"}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Edit Profile
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-500 text-sm font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        {data && (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 bg-orange-100 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl">
                <UserIcon className="w-16 h-16 text-orange-600" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <h1 className="text-4xl font-black text-slate-900">
                      {data.firstName} {data.lastName}
                    </h1>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      data.status === 'active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {data.status}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium">Tree Member • Added {formatDate(data.createdAt)}</p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
                >
                  <PersonForm 
                    initialData={data} 
                    onSubmit={(vals) => updateMutation.mutate(vals)}
                    isLoading={updateMutation.isPending} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {/* Detailed Info */}
                  <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xl font-black text-slate-900">About</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                          <p className="text-slate-900 font-medium capitalize">{data.gender || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Birth Date</p>
                          <p className="text-slate-900 font-medium">
                            {formatDate(data.birthDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xl font-black text-slate-900">Contact Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Mail className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="text-slate-900 font-medium">{data.email || 'Private or not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Phone className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                            <p className="text-slate-900 font-medium">{data.phone || 'Private or not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-8">
                    <div className="bg-linear-to-br from-orange-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-200">
                      <ShieldAlert className="w-8 h-8 mb-4 opacity-50" />
                      <h3 className="text-xl font-black mb-2">Privacy Focus</h3>
                      <p className="text-orange-100 text-sm leading-relaxed">
                        This profile's visibility is managed by tree administrators. 
                        Sensitive data is only shown based on the permissions granted.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </DataState>
    </div>
  );
}
