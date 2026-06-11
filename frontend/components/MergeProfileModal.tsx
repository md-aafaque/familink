"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { X, Search, GitMerge, Loader2, AlertTriangle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "./providers/ThemeProvider";

interface MergeProfileModalProps {
  treeId: string;
  sourcePerson: {
    id: string;
    firstName: string;
    lastName?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function MergeProfileModal({
  treeId,
  sourcePerson,
  onClose,
  onSuccess,
}: MergeProfileModalProps) {
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();

  const { data: people, isLoading: isLoadingPeople } = useQuery({
    queryKey: ["tree-people", treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/people`);
      return (res as any).data;
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        `/trees/${treeId}/people/${sourcePerson.id}/merge-into/${selectedTarget.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", sourcePerson.id] });
      queryClient.invalidateQueries({ queryKey: ["person", selectedTarget.id] });
      queryClient.invalidateQueries({ queryKey: ["tree-people", treeId] });
      onSuccess();
      onClose();
    },
  });

  const filteredPeople = people?.filter(
    (p: any) =>
      p.id !== sourcePerson.id &&
      p.status !== "merged" &&
      (p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={cn("absolute inset-0 backdrop-blur-sm transition-colors duration-500", theme.colors.bg)}
        style={{ opacity: 0.45 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-500",
          theme.colors.surface,
          theme.colors.border
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-8 border-b flex items-center justify-between transition-colors duration-500",
          theme.colors.border,
          theme.colors.surface
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500",
              theme.colors.primaryMuted
            )}>
              <GitMerge className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <div>
              <h2 className={cn("text-xl font-black", theme.colors.text)}>Merge Profile</h2>
              <p className={cn("text-sm font-medium", theme.colors.textMuted)}>Consolidate duplicate family members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn("p-2 rounded-xl transition-colors", theme.colors.bg, theme.colors.border)}
          >
            <X className={cn("w-6 h-6", theme.colors.text)} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {step === "select" ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className={cn(
                  "p-4 rounded-2xl border space-y-2 transition-colors duration-500",
                  theme.colors.bg,
                  theme.colors.border
                )}>
                  <p className={cn("text-xs font-black uppercase tracking-widest", theme.colors.textMuted)}>Merging Source</p>
                  <p className={cn("font-bold", theme.colors.text)}>{sourcePerson.firstName} {sourcePerson.lastName}</p>
                  <p className={cn("text-xs", theme.colors.textMuted)}>This profile will be marked as merged and its relationships will move to the target.</p>
                </div>

                <div className="space-y-4">
                  <label className={cn("text-sm font-black uppercase tracking-widest", theme.colors.text)}>
                    Select Target Profile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-500", theme.colors.textMuted)} />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className={cn(
                        "w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all border focus:ring-2 focus:ring-primary/50",
                        theme.colors.bg,
                        theme.colors.border,
                        theme.colors.text
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {isLoadingPeople ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className={cn("w-8 h-8 animate-spin", theme.colors.accent)} />
                      </div>
                    ) : filteredPeople?.length === 0 ? (
                      <div className={cn("text-center py-8 text-sm font-medium", theme.colors.textMuted)}>
                        No other profiles found.
                      </div>
                    ) : (
                      filteredPeople?.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedTarget(p)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            selectedTarget?.id === p.id
                              ? cn(theme.colors.primaryMuted, theme.colors.border, "shadow-sm")
                              : cn(theme.colors.surface, theme.colors.border, "hover:border-indigo-400/30")
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500",
                            selectedTarget?.id === p.id ? theme.colors.primaryMuted : theme.colors.bg
                          )}>
                            <User className={cn("w-5 h-5 transition-colors duration-500", selectedTarget?.id === p.id ? theme.colors.accent : theme.colors.textMuted)} />
                          </div>
                          <div>
                            <p className={cn("font-bold", theme.colors.text)}>{p.firstName} {p.lastName}</p>
                            <p className={cn("text-xs capitalize", theme.colors.textMuted)}>{p.status} profile</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <button
                  disabled={!selectedTarget}
                  onClick={() => setStep("confirm")}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                    theme.colors.primary
                  )}
                >
                  Continue to Confirmation
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3 text-amber-700">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-tight">Warning: Destructive Action</h3>
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">
                    You are about to merge <strong className={cn(theme.colors.text)}>{sourcePerson.firstName} {sourcePerson.lastName}</strong> into <strong className={cn(theme.colors.text)}>{selectedTarget.firstName} {selectedTarget.lastName}</strong>.
                  </p>
                  <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
                    <li>All existing relationships from the source will be transferred.</li>
                    <li>Duplicate relationships will be skipped.</li>
                    <li>The source profile will be marked as "merged" and hidden from the tree.</li>
                    <li>This action is recorded in the audit history.</li>
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center space-y-2">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors duration-500", theme.colors.surface, theme.colors.border)}>
                        <User className={cn("w-8 h-8 transition-colors duration-500", theme.colors.textMuted)} />
                      </div>
                      <p className={cn("text-xs font-bold", theme.colors.textMuted)}>Source</p>
                    </div>
                    <div className={cn("transition-colors duration-500", theme.colors.accent)}>
                      <GitMerge className="w-8 h-8" />
                    </div>
                    <div className="text-center space-y-2">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border-2 transition-colors duration-500", theme.colors.primaryMuted, theme.colors.border)}>
                        <User className={cn("w-8 h-8 transition-colors duration-500", theme.colors.accent)} />
                      </div>
                      <p className={cn("text-xs font-bold", theme.colors.accent)}>Target</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep("select")}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold transition-all hover:opacity-90",
                      theme.colors.bg,
                      theme.colors.text,
                      theme.colors.border
                    )}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => mergeMutation.mutate()}
                    disabled={mergeMutation.isPending}
                    className={cn(
                      "flex-2 py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50",
                      theme.colors.primary
                    )}
                  >
                    {mergeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Merge"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
