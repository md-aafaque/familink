"use client";
import { useRouter } from 'next/navigation';
import { Shield, Users, Settings, ArrowRight, Link2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className={cn("w-8 h-8", theme.colors.accent)} />
          <h1 className={cn("text-2xl font-bold", theme.colors.text)}>Admin Dashboard</h1>
        </div>
        <p className={theme.colors.textMuted}>Manage users and system settings</p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending User Approvals */}
        <button
          onClick={() => router.push('/dashboard/manage/users')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg transition-colors", theme.colors.primaryMuted)}>
              <Users className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <ArrowRight className={cn("w-5 h-5 transition-colors opacity-40 group-hover:opacity-100", theme.colors.accent)} />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>Pending User Approvals</h3>
          <p className={theme.colors.textMuted}>Review and approve new user accounts</p>
        </button>

        {/* Pending Relationship Approvals */}
        <button
          onClick={() => router.push('/dashboard/manage/proposals')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
              <Link2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>Pending Relationships</h3>
          <p className={theme.colors.textMuted}>Review and approve family relationships</p>
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push('/admin/settings')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg transition-colors", theme.colors.primaryMuted)}>
              <Settings className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <ArrowRight className={cn("w-5 h-5 transition-colors opacity-40 group-hover:opacity-100", theme.colors.accent)} />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>System Settings</h3>
          <p className={theme.colors.textMuted}>Configure system options and preferences</p>
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className={cn("text-3xl font-bold mb-2", theme.colors.accent)}>👥</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>User Management</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Approve, reject, and manage user accounts</p>
        </div>
        <div className="card">
          <div className={cn("text-3xl font-bold mb-2", theme.colors.accent)}>🛡️</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>Admin Controls</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Create new admin accounts for other admins</p>
        </div>
        <div className="card">
          <div className={cn("text-3xl font-bold mb-2", theme.colors.textMuted)}>⚙️</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>Configuration</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Manage system settings and preferences</p>
        </div>
      </div>
    </div>
  );
}
