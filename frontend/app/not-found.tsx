"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trees, Home, ArrowLeft, SearchX } from "lucide-react";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function NotFound() {
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-6", theme.colors.bg)}>
      <div className="max-w-2xl w-full text-center space-y-12">
        {/* Animated Icon Section */}
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className={cn("w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10", theme.colors.surface, theme.colors.border)}
          >
            <SearchX className={cn("w-16 h-16", theme.colors.accent)} />
          </motion.div>
          
          {/* Decorative Elements */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={cn("absolute inset-0 -m-4 border-2 border-dashed rounded-[3rem] opacity-20", theme.colors.accent)}
          />
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn("text-6xl md:text-8xl font-black tracking-tighter", theme.colors.text)}
          >
            404
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className={cn("text-2xl md:text-3xl font-black uppercase tracking-tight", theme.colors.text)}>
                {t("notFound.title")}
            </h2>
            <p className={cn("text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed", theme.colors.textMuted)}>
                {t("notFound.subtitle")}
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className={cn(
              "px-8 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:opacity-90 active:scale-95 flex items-center gap-3",
              theme.colors.primary
            )}
          >
            <Home className="w-4 h-4" />
            {t("notFound.backToDashboard")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className={cn(
              "px-8 py-4 rounded-2xl border font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5",
              theme.colors.border,
              theme.colors.text
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("notFound.goHome")}
          </button>
        </motion.div>

        {/* Footer Branding */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
          className="pt-12"
        >
          <div className="flex items-center justify-center gap-2 grayscale brightness-0 dark:invert opacity-50">
             <Trees className="w-5 h-5" />
             <span className="text-sm font-bold tracking-tight">FamiLink</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
