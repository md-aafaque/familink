"use client";

import { useState } from "react";
import { useLanguage } from "./providers/LanguageProvider";
import { X, AlertTriangle, Edit2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import SurfaceDecorations from "./shared/SurfaceDecorations";
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
  const { t } = useLanguage();
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isRename = type === 'rename';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col items-center pt-20 pb-8 px-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className={cn("relative w-full max-w-md p-6 rounded-2xl border-2 border-[#1E293B] bg-[#FFFDF5] shadow-[4px_4px_0px_#1E293B] overflow-hidden")}
        >
          <SurfaceDecorations density="light" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-[#F97316]/10 text-[#64748B] hover:bg-[#F97316]/20 transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-3 rounded-xl border-2 border-[#1E293B]", isDelete ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400")}>
              {isDelete ? <AlertTriangle className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <h2 className={cn("text-lg font-bold", theme.colors.text)}>
              {isDelete ? t('treeActionModal.title.delete') : t('treeActionModal.title.rename')}
            </h2>
          </div>

          <p className={cn("text-sm mb-6", theme.colors.textMuted)}>
            {isDelete 
              ? <span>{t('treeActionModal.confirmDelete').replace('{treeName}', treeName)} <span className="text-red-500">*</span>:</span>
              : <span>{t('treeActionModal.confirmRename').replace('{treeName}', treeName)} <span className="text-red-500">*</span>:</span>
            }
          </p>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isDelete ? treeName : t('treeActionModal.placeholderRename')}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E2E8F0] bg-[#FFFDF5] text-[#1E293B] placeholder:text-[#64748B] outline-none focus:border-[#F97316] focus:shadow-[2px_2px_0px_rgba(249,115,22,0.3)] transition-all duration-200 mb-2"
          />
          {isRename && input.length > 0 && input.length < 4 && (
            <p className="text-red-500 text-xs mb-4">{t('treeActionModal.minLengthError')}</p>
          )}
          {isDelete && input.length > 0 && input !== treeName && (
            <p className="text-red-500 text-xs mb-4">{t('treeActionModal.nameMismatchError')}</p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border-2 border-[#1E293B] text-sm font-bold text-[#1E293B] hover:bg-[#F97316]/5 hover:border-[#F97316]/20 hover:text-[#F97316] transition-all">
              {t('common.cancel')}
            </button>
            <button 
              onClick={() => {
                if (isDelete && input !== treeName) return;
                if (isRename && input.length < 4) return;
                onConfirm(input);
                onClose();
              }}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white border-2 border-[#1E293B] shadow-[3px_3px_0px_#1E293B] hover:shadow-[5px_5px_0px_#1E293B] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-300",
                isDelete ? "bg-red-500" : "bg-[#F97316]"
              )}
              disabled={(isDelete && input !== treeName) || (isRename && input.length < 4)}
            >
              {isDelete ? t('treeActionModal.confirm.delete') : t('treeActionModal.confirm.rename')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
