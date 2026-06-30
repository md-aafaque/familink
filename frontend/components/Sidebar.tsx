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
  ImageIcon,
  Trash2,
  Merge,
  Settings,
  Sprout
} from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { useSidebar } from "./providers/SidebarProvider";
import { useLanguage } from "./providers/LanguageProvider";
import { OrangeBlob, GreenBlob } from "./shared/DecorativeElements";

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const { theme } = useAppTheme();
  const { isOpen, close } = useSidebar();
  const { t } = useLanguage();
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
    { label: t("nav.accessRequests"), icon: Users, href: "/dashboard/manage/users", active: pathname === "/dashboard/manage/users" },
    { label: t("header.relationshipProposals"), icon: GitPullRequest, href: "/dashboard/manage/proposals?tab=relationships", active: pathname === "/dashboard/manage/proposals" && (searchParams.get('tab') === 'relationships' || !searchParams.get('tab')) },
    { label: t("nav.mergeRequests"), icon: Merge, href: "/dashboard/manage/proposals?tab=merges", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'merges' },
    { label: t("nav.profileClaims"), icon: Fingerprint, href: "/dashboard/manage/proposals?tab=claims", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'claims' },
    { label: t("nav.deletionRequests"), icon: Trash2, href: "/dashboard/manage/proposals?tab=deletions", active: pathname === "/dashboard/manage/proposals" && searchParams.get('tab') === 'deletions' },
    { label: t("nav.manageInvites"), icon: ShieldCheck, href: "/dashboard/manage/invitations", active: pathname === "/dashboard/manage/invitations" },
  ];

  function NavItem({ href, icon: Icon, label, active, onClick }: { href: string; icon: any; label: string; active: boolean; onClick?: () => void }) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 relative overflow-hidden group",
          active
            ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-pop-sm"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all shrink-0",
          active
            ? "bg-primary/10 border-primary/20 text-primary"
            : "border-transparent group-hover:border-border text-muted-foreground/60 group-hover:text-foreground"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        {label}
        {active && (
          <Sprout className="w-3 h-3 ml-auto text-primary/40" />
        )}
      </Link>
    );
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={close}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-45 w-64 lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out transform flex flex-col border-r bg-background overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
        theme.colors.sidebar.bg,
        theme.colors.sidebar.border
      )}>
        <OrangeBlob className="-top-32 -right-32" size="lg" />
        <GreenBlob className="-bottom-32 -left-32" size="lg" />

        <div className={cn("h-16 flex items-center px-6 border-b relative z-10", theme.colors.sidebar.border)}>
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={close}>
            <BrandLogo className="w-8 h-8" />
            <span className={cn("text-lg font-bold tracking-tight", theme.colors.text)}>
              Fami<span className="text-primary">Link</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 relative z-10">
          <div className="space-y-1">
            <h3 className={cn("px-4 text-[10px] font-bold uppercase tracking-widest mb-3", theme.colors.textMuted)}>
              {t("nav.navigation")}
            </h3>
            <NavItem href="/dashboard" icon={Trees} label={t("nav.trees")} active={pathname === "/dashboard"} onClick={close} />
            <NavItem href="/dashboard/memories" icon={ImageIcon} label={t("nav.wall")} active={pathname === "/dashboard/memories"} onClick={close} />
            <NavItem href="/notifications" icon={Bell} label={t("nav.notifications")} active={pathname === "/notifications"} onClick={close} />
          </div>

          {isAdmin && (
            <div className="space-y-1">
              <h3 className={cn("px-4 text-[10px] font-bold uppercase tracking-widest mb-3", theme.colors.textMuted)}>
                {t("nav.admin")}
              </h3>
              {adminItems.map((item) => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={item.active} onClick={close} />
              ))}
            </div>
          )}
        </nav>

        <div className={cn("p-4 border-t mt-auto relative z-10", theme.colors.sidebar.border)}>
          <Link
            href="/dashboard/settings"
            onClick={close}
            className={cn(
              "flex items-center gap-3 mb-4 p-2.5 rounded-xl transition-all group border-2",
              pathname === "/dashboard/settings"
                ? "bg-primary/10 border-primary/30"
                : "border-transparent hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border-2 overflow-hidden shrink-0",
              pathname === "/dashboard/settings" ? "border-primary bg-primary/10" : "border-border"
            )}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserCircle className={cn("w-5 h-5", pathname === "/dashboard/settings" ? "text-primary" : "opacity-60")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-bold truncate", theme.colors.text)}>{user?.user_metadata.full_name || t('common.defaultUserName')}</p>
              <p className={cn("text-[9px] font-medium truncate opacity-50 uppercase tracking-widest", theme.colors.textMuted)}>{t("nav.accountSettings")}</p>
            </div>
            <Settings className={cn(
              "w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-all duration-300",
              theme.colors.text,
              pathname === "/dashboard/settings" && "opacity-100 text-primary"
            )} />
          </Link>

          <button
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 border-transparent",
              "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 active:scale-[0.98]"
            )}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-transparent group-hover:border-red-200 dark:group-hover:border-red-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            {t("nav.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
