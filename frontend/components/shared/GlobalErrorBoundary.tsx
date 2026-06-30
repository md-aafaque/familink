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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border-2 border-border bg-card p-12 text-center shadow-pop-lg space-y-8">
        <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-destructive/20">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('errorBoundary.title')}</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            {t('errorBoundary.subtitle')}
          </p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-muted rounded-xl text-left font-mono text-xs text-destructive overflow-auto max-h-40 border-2 border-border">
            {error?.toString()}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-pop-sm active:scale-[0.98]"
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
