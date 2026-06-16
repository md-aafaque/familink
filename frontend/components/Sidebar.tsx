"use client";

import { useAuth } from "./providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Activity,
  Link as LinkIcon,
  ImageIcon,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { useSidebar } from "./providers/SidebarProvider";

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const { theme } = useAppTheme();
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: trees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
    enabled: !!user,
  });

  const isAdmin = trees?.some((t: any) => t.role === 'admin');

  const adminItems = [
    { label: "Access Requests", icon: Users, href: "/dashboard/manage/users", active: pathname === "/dashboard/manage/users" },
    { label: "Review Proposals", icon: GitPullRequest, href: "/dashboard/manage/proposals?tab=relationships", active: pathname === "/dashboard/manage/proposals" && (searchParams.get('tab') === 'relationships' || !searchParams.get('tab')) },
    { label: "Merge Requests", icon: Activity, href: "/dashboard/manage/proposals?tab=merges", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'merges' },
    { label: "Profile Claims", icon: Fingerprint, href: "/dashboard/manage/proposals?tab=claims", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'claims' },
    { label: "Deletion Requests", icon: Trash2, href: "/dashboard/manage/proposals?tab=deletions", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'deletions' },
    { label: "Manage Invites", icon: ShieldCheck, href: "/dashboard/manage/invitations", active: pathname === "/dashboard/manage/invitations" },
  ];

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={close}
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
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={close}>
            <div className={cn("w-8 h-8 rounded flex items-center justify-center", theme.colors.primary)}>
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <span className={cn("text-lg font-bold tracking-tight", theme.colors.text)}>
              Fami<span className={theme.colors.accent}>Link</span>
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
            <Link
              href="/dashboard"
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/dashboard" 
                  ? cn(theme.colors.sidebar.itemHover, theme.colors.sidebar.activeText)
                  : cn(theme.colors.textMuted, theme.colors.sidebar.hoverText, theme.colors.sidebar.itemHover)
              )}
            >
              <Trees className={cn("w-4 h-4", pathname === "/dashboard" ? theme.colors.accent : "opacity-60")} />
              My Family Trees
            </Link>
            <Link
              href="/dashboard/memories"
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/dashboard/memories" 
                  ? cn(theme.colors.sidebar.itemHover, theme.colors.sidebar.activeText)
                  : cn(theme.colors.textMuted, theme.colors.sidebar.hoverText, theme.colors.sidebar.itemHover)
              )}
            >
              <ImageIcon className={cn("w-4 h-4", pathname === "/dashboard/memories" ? theme.colors.accent : "opacity-60")} />
              Family Wall
            </Link>
            <Link
              href="/notifications"
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/notifications" 
                  ? cn(theme.colors.sidebar.itemHover, theme.colors.sidebar.activeText)
                  : cn(theme.colors.textMuted, theme.colors.sidebar.hoverText, theme.colors.sidebar.itemHover)
              )}
            >
              <Bell className={cn("w-4 h-4", pathname === "/notifications" ? theme.colors.accent : "opacity-60")} />
              Notifications
            </Link>
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
                  onClick={close}
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
