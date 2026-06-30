"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./shared/Footer";
import { useAuth } from "./providers/AuthProvider";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PageBackground from "./decorations/PageBackground";
import { OrangeBlob, DotPattern } from "./shared/DecorativeElements";

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
  const isTreeRoute = pathname.startsWith('/tree/');

  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      router.replace(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!authLoading && !treesLoading && user && isManagementRoute && !isAdmin) {
      console.warn("[RBAC] Unauthorized access to management route. Redirecting...");
      setIsRedirecting(true);
      router.replace("/dashboard");
    }

    if (!isManagementRoute && isRedirecting) {
      setIsRedirecting(false);
    }
  }, [user, authLoading, treesLoading, isAdmin, isManagementRoute, router, isRedirecting]);

  if (authLoading || (isManagementRoute && treesLoading) || isRedirecting) {
    return (
      <div className={cn("flex items-center justify-center h-screen bg-background relative overflow-hidden")}>
        <OrangeBlob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size="lg" />
        <DotPattern fade />
        <div className="relative z-10 text-center space-y-4">
          {isRedirecting ? (
            <>
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className={cn("text-lg font-bold uppercase tracking-tighter", theme.colors.text)}>{t('layout.accessRestricted')}</p>
                <p className={cn("text-sm font-medium", theme.colors.textMuted)}>{t('layout.noPermission')}</p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className={cn("w-10 h-10 animate-spin mx-auto", "text-primary")} />
              <p className={cn("text-sm font-medium", theme.colors.textMuted)}>{t('layout.loadingWorkspace')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

   return (
    <div className={cn("flex h-screen overflow-hidden")}>
      {!isTreeRoute && <PageBackground variant="dashboard" />}
      <div className="relative z-10 flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          {isTreeRoute ? (
            <main className="relative flex-1 overflow-hidden">
              {children}
            </main>
          ) : (
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="px-6 md:px-8 lg:px-10 pt-6 md:pt-8 lg:pt-10 pb-6 md:pb-8 lg:pb-10">
                  <div className="max-w-6xl mx-auto">
                    {children}
                  </div>
                </div>
              </div>
              <Footer />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
