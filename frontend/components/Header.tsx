"use client";

import NotificationsMenu from "@/components/NotificationsMenu";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

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

  return (
    <header className="flex items-center justify-between p-6 bg-white border-b border-slate-100">
      <div className="lg:hidden w-10"></div> {/* Spacer for sidebar toggle on mobile */}
      <h1 className="text-xl font-black text-slate-800 tracking-tight">
        {getTitle()}
      </h1>
      <div className="flex items-center gap-4 ml-auto">
        <NotificationsMenu />
      </div>
    </header>
  );
}
