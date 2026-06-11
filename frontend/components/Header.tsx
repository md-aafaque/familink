"use client";

import NotificationsMenu from "@/components/NotificationsMenu";
import { usePathname } from "next/navigation";
import { useAppTheme, AppThemeType } from "./providers/ThemeProvider";
import { useSidebar } from "./providers/SidebarProvider";
import { Maximize, Minimize, Moon, Sun, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const { themeType, setTheme, theme } = useAppTheme();
  const { toggle } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getTitle = () => {
    if (pathname.includes('/dashboard/manage/proposals')) return 'Relationship Proposals';
    if (pathname.includes('/dashboard/manage/invitations')) return 'Tree Invitations';
    if (pathname.includes('/dashboard/manage/claims')) return 'Profile Claims';
    if (pathname.includes('/dashboard/manage/users')) return 'Access Requests';
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/tree/')) return 'Family Tree';
    if (pathname.includes('/notifications')) return 'Notifications';
    return 'Family Tree';
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
            "lg:hidden p-2 rounded-md transition-colors",
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
        <div className={cn("flex items-center p-1 rounded-md border", theme.colors.bg, theme.colors.border)}>
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "p-1.5 rounded transition-colors",
              themeType === 'light' 
                ? cn("bg-white shadow-sm border border-slate-200", theme.colors.accent)
                : "text-slate-400 hover:text-slate-600"
            )}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "p-1.5 rounded transition-colors",
              themeType === 'dark' 
                ? cn("bg-slate-800 shadow-sm border border-slate-700", theme.colors.accent) 
                : "text-slate-500 hover:text-slate-300"
            )}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {pathname.includes('/tree/') && (
          <button 
            onClick={toggleFullscreen}
            className={cn(
              "p-2 rounded-md border transition-colors",
              theme.colors.bg,
              theme.colors.border,
              "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        )}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
        <NotificationsMenu />
      </div>
    </header>
  );
}
