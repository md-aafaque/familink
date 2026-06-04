"use client";

import { X, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import PersonForm from "./PersonForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface CreatePersonModalProps {
  treeId: string;
  onClose: () => void;
  onSuccess?: (person: any) => void;
}

export default function CreatePersonModal({
  treeId,
  onClose,
  onSuccess,
}: CreatePersonModalProps) {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/trees/${treeId}/people`, data);
      return (res as any).data;
    },
    onSuccess: (newPerson) => {
      queryClient.invalidateQueries({ queryKey: ["tree-people-sandbox", treeId] });
      queryClient.invalidateQueries({ queryKey: ["tree-visual", treeId] });
      onSuccess?.(newPerson);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "relative w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transition-colors duration-500",
          theme.colors.surface
        )}
      >
        {/* Header */}
        <div className={cn("px-8 py-6 border-b flex items-center justify-between", theme.colors.border)}>
          <div className="flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
              <UserPlus className={cn("w-5 h-5", theme.colors.accent)} />
            </div>
            <div>
              <h2 className={cn("text-xl font-black leading-tight", theme.colors.text)}>
                Add New Relative
              </h2>
              <p className={cn("text-xs font-medium mt-0.5", theme.colors.textMuted)}>
                Create a new profile in your family tree
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={cn(
              "p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5",
              theme.colors.textMuted
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 max-h-[70vh] overflow-y-auto">
          <PersonForm 
            treeId={treeId}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </div>
      </motion.div>
    </div>
  );
}
