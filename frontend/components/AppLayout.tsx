"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "./providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppTheme } from "./providers/ThemeProvider";
import { cn } from "@/lib/cn";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-screen", theme.colors.bg)}>
        <div className="text-center space-y-3">
          <Loader2 className={cn("w-10 h-10 animate-spin mx-auto", theme.colors.accent)} />
          <p className={cn("text-sm font-medium", theme.colors.textMuted)}>Loading your workspace...</p>
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
