"use client";

import { ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";

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
  loadingMessage = "Loading data...",
}: DataStateProps) {
  const { theme } = useAppTheme();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className={cn("w-10 h-10 animate-spin", theme.colors.accent)} />
        <p className="text-slate-600 font-medium">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card border-red-200 bg-red-50 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-red-900">Something went wrong</h3>
        <p className="text-red-700 max-w-md mx-auto">
          {error?.message || "An unexpected error occurred while fetching data."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary border-red-300 text-red-700 hover:bg-red-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
