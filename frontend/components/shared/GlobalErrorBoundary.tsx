"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage, LanguageProvider } from "../providers/LanguageProvider";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallbackContent({ error }: { error: Error | null }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100 space-y-8">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('errorBoundary.title')}</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {t('errorBoundary.subtitle')}
          </p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-slate-50 rounded-2xl text-left font-mono text-xs text-red-600 overflow-auto max-h-40 border border-slate-100">
            {error?.toString()}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <RotateCcw className="w-5 h-5" />
          {t('errorBoundary.retry')}
        </button>
      </div>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error | null }) {
  return (
    <LanguageProvider>
      <ErrorFallbackContent error={error} />
    </LanguageProvider>
  );
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
