"use client";

import { useAuth } from "./providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Trees, 
  Bell, 
  Users, 
  GitPullRequest, 
  Fingerprint, 
  ShieldCheck, 
  UserCircle, 
  LogOut,
  Menu,
  X,
  Activity
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { data: trees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
    enabled: !!user,
  });

  const isAdmin = trees?.some((t: any) => t.role === 'admin');

  const menuItems = [
    { label: "My Family Trees", icon: Trees, href: "/dashboard", active: pathname === "/dashboard" },
    { label: "Notifications", icon: Bell, href: "/notifications", active: pathname === "/notifications" },
  ];

  const adminItems = [
    { label: "Access Requests", icon: Users, href: "/dashboard/manage/users", active: pathname === "/dashboard/manage/users" },
    { label: "Review Proposals", icon: GitPullRequest, href: "/dashboard/manage/proposals", active: pathname === "/dashboard/manage/proposals" },
    { label: "Profile Claims", icon: Fingerprint, href: "/dashboard/manage/claims", active: pathname === "/dashboard/manage/claims" },
    { label: "Manage Invites", icon: ShieldCheck, href: "/dashboard/manage/invitations", active: pathname === "/dashboard/manage/invitations" },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md border shadow-sm transition-colors",
          theme.colors.surface,
          theme.colors.border,
          theme.colors.text
        )}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Component */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-45 w-64 lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out transform flex flex-col border-r",
        isOpen ? "translate-x-0" : "-translate-x-full",
        theme.colors.sidebar.bg,
        theme.colors.sidebar.border
      )}>
        {/* Logo Section */}
        <div className={cn("h-16 flex items-center px-6 border-b", theme.colors.sidebar.border)}>
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div className={cn("w-8 h-8 rounded flex items-center justify-center", theme.colors.primary)}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className={cn("text-lg font-bold tracking-tight", theme.colors.text)}>
              Family<span className={theme.colors.accent}>Nexus</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {/* Main Menu */}
          <div className="space-y-1">
            <h3 className={cn("px-3 text-[10px] font-bold uppercase tracking-widest mb-2", theme.colors.textMuted)}>
              Navigation
            </h3>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  item.active 
                    ? cn(theme.colors.sidebar.itemHover, theme.colors.sidebar.activeText)
                    : cn(theme.colors.textMuted, theme.colors.sidebar.hoverText, theme.colors.sidebar.itemHover)
                )}
              >
                <item.icon className={cn("w-4 h-4", item.active ? theme.colors.accent : "opacity-60")} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="space-y-1">
              <h3 className={cn("px-3 text-[10px] font-bold uppercase tracking-widest mb-2", theme.colors.textMuted)}>
                Admin
              </h3>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    item.active 
                      ? cn(theme.colors.sidebar.itemHover, theme.colors.sidebar.activeText)
                      : cn(theme.colors.textMuted, theme.colors.sidebar.hoverText, theme.colors.sidebar.itemHover)
                  )}
                >
                  <item.icon className={cn("w-4 h-4", item.active ? theme.colors.accent : "opacity-60")} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile & Sign Out */}
        <div className={cn("p-4 border-t mt-auto", theme.colors.sidebar.border)}>
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className={cn("w-9 h-9 rounded flex items-center justify-center border", theme.colors.primaryMuted, theme.colors.sidebar.border)}>
                <UserCircle className={cn("w-5 h-5", theme.colors.accent)} />
             </div>
             <div className="min-w-0">
                <p className={cn("text-xs font-bold truncate", theme.colors.text)}>{user?.email?.split('@')[0]}</p>
                <p className={cn("text-[10px] font-medium truncate opacity-50", theme.colors.textMuted)}>Free Tier</p>
             </div>
          </div>
          
          <button
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              theme.colors.textMuted,
              "hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
            )}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
