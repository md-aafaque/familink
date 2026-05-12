"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "./providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium animate-pulse">Preparing your family tree...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
