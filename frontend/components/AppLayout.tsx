"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "./providers/AuthProvider";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch trees to check for admin status
  const { data: trees, isLoading: treesLoading } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
    enabled: !!user,
  });

  const isAdmin = trees?.some((t: any) => t.role === 'admin');
  const isManagementRoute = pathname.startsWith('/dashboard/manage');

  useEffect(() => {
    // 1. Auth Protection
    if (!authLoading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      router.replace(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    // 2. Admin Protection (RBAC)
    if (!authLoading && !treesLoading && user && isManagementRoute && !isAdmin) {
      console.warn("[RBAC] Unauthorized access to management route. Redirecting...");
      setIsRedirecting(true);
      router.replace("/dashboard");
    }

    // 3. Reset redirect state if we've moved away from management routes
    if (!isManagementRoute && isRedirecting) {
      setIsRedirecting(false);
    }
  }, [user, authLoading, treesLoading, isAdmin, isManagementRoute, router, isRedirecting]);

  // Loading State
  if (authLoading || (isManagementRoute && treesLoading) || isRedirecting) {
    return (
      <div className={cn("flex items-center justify-center h-screen", theme.colors.bg)}>
        <div className="text-center space-y-4">
          {isRedirecting ? (
            <>
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className={cn("text-lg font-black uppercase tracking-tighter", theme.colors.text)}>{t('layout.accessRestricted')}</p>
                <p className={cn("text-sm font-medium", theme.colors.textMuted)}>{t('layout.noPermission')}</p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className={cn("w-10 h-10 animate-spin mx-auto", theme.colors.accent)} />
              <p className={cn("text-sm font-medium", theme.colors.textMuted)}>{t('layout.loadingWorkspace')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={cn("flex h-screen overflow-hidden", theme.colors.bg)}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
