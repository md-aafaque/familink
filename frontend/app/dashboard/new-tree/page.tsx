"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import { ArrowLeft, Loader2, Sparkles, TreeDeciduous } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

export default function NewTreePage() {
  const [name, setName] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { t } = useLanguage();

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
    <div className="relative">

      <div className="relative z-10 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className={cn("flex items-center gap-2 transition-colors mb-8 group", "text-muted-foreground hover:text-foreground")}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t("newTree.backToDashboard")}
        </button>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className={cn("inline-flex items-center gap-3 px-4 py-2 rounded-full border-2", "bg-primary/10 border-primary/20")}>
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary">{t("newTree.badge")}</span>
            </div>
            <h1 className={cn("text-4xl font-bold tracking-tight", theme.colors.text)}>
              {t("newTree.title")}
            </h1>
            <p className={cn("text-lg", theme.colors.textMuted)}>
              {t("newTree.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <TreeDeciduous className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6", "text-muted-foreground group-focus-within:text-primary")} />
              <input
                type="text"
                autoFocus
                required
                placeholder={t("newTree.placeholder")}
                className={cn(
                  "w-full pl-14 pr-6 py-5 rounded-2xl text-xl font-semibold outline-none border-2 transition-all",
                  "bg-background text-foreground border-border focus:border-primary focus:shadow-pop-sm"
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            <Button
              type="submit"
              variant="candy"
              className="w-full py-5 text-lg"
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {t("common.createTree")}
                  <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className={cn("p-6 rounded-2xl border-2", "bg-primary/5 border-primary/10")}>
            <p className={cn("text-sm leading-relaxed", theme.colors.text)}>
              <strong className="text-primary">{t("newTree.proTip")}:</strong> {t("newTree.proTipBody")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
