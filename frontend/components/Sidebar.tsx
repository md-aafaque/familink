"use client";

import { useAuth } from "./providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  TreeDeciduous, 
  Bell, 
  Settings, 
  LogOut, 
  Plus,
  ChevronRight,
  User,
  Shield,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import NotificationsMenu from "./NotificationsMenu";

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { data: trees, isLoading } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
    enabled: !!user,
  });

  const isAdmin = trees?.some((t: any) => t.role === 'admin');

  const navItems = [
    { label: "Dashboard", iconComponent: Home, href: "/dashboard" },
    { label: "Notifications", iconComponent: Bell, href: "/notifications" },
    ...(isAdmin ? [
      { label: "Review Proposals", iconComponent: Shield, href: "/dashboard/manage/proposals" },
      { label: "Access Requests", iconComponent: User, href: "/dashboard/manage/users" },
      { label: "Profile Claims", iconComponent: Shield, href: "/dashboard/manage/claims" },
      { label: "Invitations", iconComponent: Plus, href: "/dashboard/manage/invitations" },
    ] : []),
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 p-3 bg-white border border-slate-200 rounded-2xl shadow-lg text-slate-600"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside 
        className={cn(
          "w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 overflow-y-auto transition-transform duration-300 z-50",
          "fixed lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main Navigation"
      >
        <div className="lg:hidden absolute top-6 right-6">
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-slate-100 bg-linear-to-br from-orange-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200 shadow-sm flex-shrink-0"
              aria-hidden="true"
            >
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <NotificationsMenu />
        </div>

        {/* Main Nav */}
        <nav className="p-4 space-y-1" aria-label="Main Links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-orange-50 text-orange-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.iconComponent className={cn(
                "w-5 h-5",
                pathname === item.href ? "text-orange-600" : "text-slate-400"
              )} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Trees Section */}
        <div className="flex-1 px-4 py-6">
          <div className="flex items-center justify-between px-3 mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Trees</h2>
            <Link 
              href="/dashboard/new-tree"
              onClick={() => setIsOpen(false)}
              aria-label="Create new tree"
              className="p-1 rounded-md hover:bg-orange-50 text-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-1" role="list">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg mx-3" />
              ))
            ) : trees && trees.length > 0 ? (
              trees.map((tree: any) => (
                <Link
                  key={tree.id}
                  href={`/tree/${tree.id}`}
                  onClick={() => setIsOpen(false)}
                  role="listitem"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    pathname.includes(`/tree/${tree.id}`)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <TreeDeciduous className={cn(
                    "w-5 h-5",
                    pathname.includes(`/tree/${tree.id}`) ? "text-blue-600" : "text-slate-400"
                  )} aria-hidden="true" />
                  <span className="flex-1 truncate">{tree.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            ) : (
              <p className="px-3 py-4 text-xs text-slate-400 italic">No trees created yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
