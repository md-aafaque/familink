"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';

export default function AdminSettings() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin')}
          className={cn("flex items-center gap-2 font-medium mb-4 transition-colors", theme.colors.accent, "hover:opacity-80")}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Settings className={cn("w-8 h-8", theme.colors.accent)} />
          <h1 className={cn("text-2xl font-bold", theme.colors.text)}>System Settings</h1>
        </div>
        <p className={theme.colors.textMuted}>Configure system options and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="card">
        <div className={cn("border-b pb-4 mb-4", theme.colors.border)}>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>General Settings</h3>
          <p className={theme.colors.textMuted}>Configure general system settings</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className={cn("block text-sm font-medium mb-2", theme.colors.text)}>System Name</label>
            <input
              type="text"
              value="Family Nexus Application"
              disabled
              className={cn("w-full input-field opacity-60", theme.colors.bg)}
            />
          </div>
          <div>
            <label className={cn("block text-sm font-medium mb-2", theme.colors.text)}>Version</label>
            <input
              type="text"
              value="1.0.0"
              disabled
              className={cn("w-full input-field opacity-60", theme.colors.bg)}
            />
          </div>
        </div>
      </div>

      {/* User Settings */}
      <div className="card">
        <div className={cn("border-b pb-4 mb-4", theme.colors.border)}>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>User Settings</h3>
          <p className={theme.colors.textMuted}>Configure user-related options</p>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>Require email verification for new users</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>Require admin approval for user accounts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>Allow users to delete their own accounts</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button className="btn-primary">Save Settings</button>
        <button className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
