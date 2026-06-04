"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import { ArrowLeft, Loader2, Sparkles, TreeDeciduous } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";

export default function NewTreePage() {
  const [name, setName] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();

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
        className={cn("flex items-center gap-2 transition-colors mb-8 group", theme.colors.textMuted, "hover:" + theme.colors.text)}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="space-y-12">
        <div className="space-y-4">
          <div className={cn("inline-flex items-center gap-3 px-4 py-2 rounded-full border", theme.colors.primaryMuted, "border-primary/10")}>
            <Sparkles className={cn("w-5 h-5", theme.colors.accent)} />
            <span className={cn("text-sm font-bold", theme.colors.accent)}>Start a new journey</span>
          </div>
          <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
            Name your <span className={theme.colors.accent}>Family Tree</span>
          </h1>
          <p className={cn("text-lg", theme.colors.textMuted)}>
            Every family has a story. Give yours a beautiful starting point. 
            You can change this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <TreeDeciduous className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 transition-colors", theme.colors.textMuted, "group-focus-within:" + theme.colors.accent)} />
            <input
              type="text"
              autoFocus
              required
              placeholder="The Sharma Family..."
              className={cn(
                "w-full pl-16 pr-6 py-5 rounded-2xl text-xl font-semibold shadow-sm focus:ring-4 transition-all outline-none border",
                theme.colors.bg,
                theme.colors.text,
                "border-border focus:border-primary focus:ring-primary/10"
              )}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className={cn(
              "w-full py-5 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group",
              theme.colors.primary,
              "hover:opacity-90"
            )}
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

        <div className={cn("p-6 rounded-2xl border", theme.colors.primaryMuted, "border-primary/5")}>
          <p className={cn("text-sm leading-relaxed", theme.colors.text)}>
            <strong className={theme.colors.accent}>Pro tip:</strong> Most families use their last name, 
            like "The Andersons" or "Smith Ancestry". 
            You can invite your relatives to collaborate once the tree is created.
          </p>
        </div>
      </div>
    </div>
  );
}
