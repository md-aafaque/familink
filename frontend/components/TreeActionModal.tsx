"use client";

import { useState } from "react";
import { X, AlertTriangle, Edit2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'rename' | 'delete';
  treeName: string;
  onConfirm: (input: string) => void;
}

export default function TreeActionModal({ isOpen, onClose, type, treeName, onConfirm }: ModalProps) {
  const { theme } = useAppTheme();
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isRename = type === 'rename';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className={cn("relative w-full max-w-md p-6 rounded-3xl border shadow-2xl", theme.colors.surface, theme.colors.border)}
        >
          <button onClick={onClose} className={cn("absolute top-4 right-4 p-2 rounded-full", theme.colors.bg, "hover:" + theme.colors.accent)}>
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-3 rounded-2xl", isDelete ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
              {isDelete ? <AlertTriangle className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <h2 className={cn("text-lg font-black uppercase tracking-widest", theme.colors.text)}>
              {isDelete ? "Delete Tree" : "Rename Tree"}
            </h2>
          </div>

          <p className={cn("text-sm mb-6", theme.colors.textMuted)}>
            {isDelete 
              ? <span>Are you sure you want to delete "{treeName}"? This action cannot be undone. Please type the name of the tree to confirm <span className="text-red-500">*</span>:</span>
              : <span>Enter a new name for your tree "{treeName}" <span className="text-red-500">*</span>:</span>
            }
          </p>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isDelete ? treeName : "New name..."}
            className={cn("w-full px-4 py-3 rounded-xl border mb-2 outline-none focus:ring-2", theme.colors.bg, theme.colors.border, theme.colors.text)}
          />
          {isRename && input.length > 0 && input.length < 4 && (
            <p className="text-red-500 text-xs mb-4">Minimum 4 characters required.</p>
          )}
          {isDelete && input.length > 0 && input !== treeName && (
            <p className="text-red-500 text-xs mb-4">Tree name does not match.</p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className={cn("flex-1 px-4 py-3 rounded-xl text-sm font-bold", theme.colors.bg, theme.colors.text)}>
              Cancel
            </button>
            <button 
              onClick={() => {
                if (isDelete && input !== treeName) return;
                if (isRename && input.length < 4) return;
                onConfirm(input);
                onClose();
              }}
              className={cn("flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg", isDelete ? "bg-red-600 hover:bg-red-700" : theme.colors.primary)}
              disabled={(isDelete && input !== treeName) || (isRename && input.length < 4)}
            >
              {isDelete ? "Delete Tree" : "Rename Tree"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
