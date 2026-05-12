"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import { ArrowLeft, Loader2, Sparkles, TreeDeciduous } from "lucide-react";

export default function NewTreePage() {
  const [name, setName] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (treeName: string) => {
      const res = await api.post("/trees", { name: treeName });
      return (res as any).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trees"] });
      router.push(`/tree/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate(name);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-full border border-orange-100">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-bold text-orange-700">Start a new journey</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Name your <span className="text-orange-600">Family Tree</span>
          </h1>
          <p className="text-lg text-slate-600">
            Every family has a story. Give yours a beautiful starting point. 
            You can change this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <TreeDeciduous className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              autoFocus
              required
              placeholder="The Sharma Family..."
              className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-2xl text-xl font-semibold shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-slate-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {mutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Create Tree
                <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Pro tip:</strong> Most families use their last name, 
            like "The Andersons" or "Smith Ancestry". 
            You can invite your relatives to collaborate once the tree is created.
          </p>
        </div>
      </div>
    </div>
  );
}
