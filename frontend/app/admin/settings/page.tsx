"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function AdminSettings() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin')}
          className={cn("flex items-center gap-2 font-medium mb-4 transition-colors", theme.colors.accent, "hover:opacity-80")}
        >
          <ArrowLeft className="w-5 h-5" />
          {t('adminSettings.back')}
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Settings className={cn("w-8 h-8", theme.colors.accent)} />
          <h1 className={cn("text-2xl font-bold", theme.colors.text)}>{t('adminSettings.title')}</h1>
        </div>
        <p className={theme.colors.textMuted}>{t('adminSettings.subtitle')}</p>
      </div>

      {/* Settings Sections */}
      <div className="card">
        <div className={cn("border-b pb-4 mb-4", theme.colors.border)}>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>{t('adminSettings.general.title')}</h3>
          <p className={theme.colors.textMuted}>{t('adminSettings.general.subtitle')}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className={cn("block text-sm font-medium mb-2", theme.colors.text)}>{t('adminSettings.systemName')}</label>
            <input
              type="text"
              value="FamiLink Application"
              disabled
              className={cn("w-full input-field opacity-60", theme.colors.bg)}
            />
          </div>
          <div>
            <label className={cn("block text-sm font-medium mb-2", theme.colors.text)}>{t('adminSettings.version')}</label>
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
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>{t('adminSettings.user.title')}</h3>
          <p className={theme.colors.textMuted}>{t('adminSettings.user.subtitle')}</p>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>{t('adminSettings.requireEmailVerification')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>{t('adminSettings.requireAdminApproval')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className={cn("w-4 h-4 rounded border-border transition-colors", "accent-primary")} />
            <span className={cn("text-sm transition-colors", theme.colors.text, "group-hover:opacity-80")}>{t('adminSettings.allowSelfDelete')}</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button className="btn-primary">{t('common.save')}</button>
        <button className="btn-secondary">{t('common.cancel')}</button>
      </div>
    </div>
  );
}
