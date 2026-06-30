"use client";

import NotificationsMenu from "@/components/NotificationsMenu";
import { usePathname } from "next/navigation";
import { useAppTheme } from "./providers/ThemeProvider";
import { useSidebar } from "./providers/SidebarProvider";
import { Maximize, Minimize, Moon, Sun, Menu } from "lucide-react";
import { useLanguage } from "./providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const { themeType, setTheme, theme } = useAppTheme();
  const { toggle } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useLanguage();

  const getTitle = () => {
    if (pathname.includes('/dashboard/manage/proposals')) return t('header.reviewProposals');
    if (pathname.includes('/dashboard/manage/invitations')) return t('header.treeInvitations');
    if (pathname.includes('/dashboard/manage/claims')) return t('header.profileClaims');
    if (pathname.includes('/dashboard/manage/users')) return t('header.accessRequests');
    if (pathname.includes('/dashboard/settings')) return t('header.accountSettings');
    if (pathname.includes('/dashboard')) return t('header.dashboard');
    if (pathname.includes('/tree/')) return t('header.familyTree');
    if (pathname.includes('/notifications')) return t('header.notifications');
    return t('header.familyTree');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-6 border-b sticky top-0 z-50 transition-colors",
      theme.colors.header.bg,
      theme.colors.header.border,
      "backdrop-blur-md"
    )}>
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={cn(
            "lg:hidden p-2 rounded-lg transition-colors",
            theme.colors.hover,
            theme.colors.text
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className={cn("text-base font-bold tracking-tight", theme.colors.text)}>
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className={cn("flex items-center p-1 rounded-xl border-2", theme.colors.bg, theme.colors.border)}>
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              themeType === 'light'
                ? "bg-primary text-primary-foreground shadow-pop-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t('header.lightMode')}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              themeType === 'dark'
                ? "bg-primary text-primary-foreground shadow-pop-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t('header.darkMode')}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {pathname.includes('/tree/') && (
          <button
            onClick={toggleFullscreen}
            className={cn(
              "p-2 rounded-xl border-2 transition-colors",
              theme.colors.bg,
              theme.colors.border,
              "text-muted-foreground hover:text-foreground"
            )}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        )}
        <div className="w-px h-6 bg-border mx-1" />
        <NotificationsMenu />
      </div>
    </header>
  );
}
