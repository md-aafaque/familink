"use client";

import { ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";

interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  children: ReactNode;
  loadingMessage?: string;
}

export default function DataState({
  isLoading,
  isError,
  error,
  children,
  loadingMessage,
}: DataStateProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className={cn("w-10 h-10 animate-spin", theme.colors.accent)} />
        <p className="text-slate-600 font-medium">{loadingMessage || t('dataState.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border-2 border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 p-8 md:p-12 text-center space-y-4 shadow-pop-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 border-2 border-red-200 dark:border-red-700 text-red-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">{t('dataState.error.title')}</h3>
        <p className="text-sm text-red-600 dark:text-red-400 max-w-md mx-auto">
          {error?.message || t('dataState.error.subtitle')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white border-2 border-red-700 dark:border-red-300 rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-300"
        >
          {t('dataState.error.retry')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
