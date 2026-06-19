"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/cn";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Trash2, 
  Save, 
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Camera,
  Smartphone,
  MailQuestion,
  Fingerprint,
  Zap,
  Key,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Link as LinkIcon,
  Phone,
  Layout,
  Languages,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SiGoogle } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/components/providers/LanguageProvider";

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'preferences';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, themeType, setTheme } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security States
  const [securityData, setSecurityData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Fetch full user profile from backend
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return (res as any).data;
    },
    enabled: !!user,
  });

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
    phone: "",
    language: "English (US)",
    timezone: "UTC +05:30 (IST)",
    notificationPreferences: {
      email: true,
      push: false,
      marketing: false
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        phone: profile.phone || "",
        language: profile.language || "English (US)",
        timezone: profile.timezone || "UTC +05:30 (IST)",
        notificationPreferences: profile.notificationPreferences ? (
            typeof profile.notificationPreferences === 'string' 
                ? JSON.parse(profile.notificationPreferences) 
                : profile.notificationPreferences
        ) : {
          email: true,
          push: false,
          marketing: false
        }
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      // 1. Update Backend (Neo4j)
      const res = await api.patch("/auth/profile", updates);
      
      // 2. Sync with Supabase metadata for immediate frontend reflection
      if (updates.name || updates.avatarUrl) {
          const { error } = await supabase.auth.updateUser({
              data: { 
                  full_name: updates.name,
                  avatar_url: updates.avatarUrl 
              }
          });
          if (error) console.error("[Supabase Sync] Failed:", error.message);
      }
      
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setSuccessMessage(t('settings.status.syncSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
        console.error("[Update Error]:", err);
        setErrorMessage(err.message || t('settings.status.syncFailed'));
        setTimeout(() => setErrorMessage(null), 3000);
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      name: formData.name,
      bio: formData.bio,
      avatarUrl: formData.avatarUrl,
      phone: formData.phone,
      language: formData.language,
      timezone: formData.timezone,
      notificationPreferences: formData.notificationPreferences
    });
  };

  const handleUpdatePassword = async () => {
    if (!securityData.password || securityData.password !== securityData.confirmPassword) {
        setErrorMessage(t('settings.status.passwordMismatch'));
        setTimeout(() => setErrorMessage(null), 3000);
        return;
    }

    setIsUpdatingPassword(true);
    try {
        const { error } = await supabase.auth.updateUser({
            password: securityData.password
        });
        if (error) throw error;
        
        setSuccessMessage(t('settings.status.passwordSuccess'));
        setSecurityData({ password: "", confirmPassword: "" });
    } catch (err: any) {
        setErrorMessage(err.message || t('settings.status.passwordFailed'));
    } finally {
        setIsUpdatingPassword(false);
        setTimeout(() => {
            setSuccessMessage(null);
            setErrorMessage(null);
        }, 3000);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t('settings.termination.confirmMessage'));
    if (!confirmed) return;

    const finalConfirm = window.prompt(t('settings.termination.confirmPrompt'));
    if (finalConfirm !== 'DELETE') return;

    setIsDeletingAccount(true);
    try {
        await api.delete("/auth/account");
        await signOut();
    } catch (err: any) {
        setErrorMessage(err.message || t('settings.status.terminateFailed'));
        setIsDeletingAccount(false);
    }
  };

  const handleAutoScan = () => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserLang = navigator.language;
        
        // Map common browser locales to our select options if possible
        const languageMap: Record<string, string> = {
            'en': 'English (US)',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese'
        };
        
        const langKey = browserLang.split('-')[0];
        const detectedLang = languageMap[langKey] || 'English (US)';

        setFormData({
            ...formData,
            timezone: `UTC ${timezone}`, // Format might need adjustment based on dropdown expectations
            language: detectedLang
        });

        setSuccessMessage(t('settings.status.autoScanSuccess').replace('{lang}', detectedLang).replace('{tz}', timezone));
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
        setErrorMessage(t('settings.status.autoScanFailed'));
        setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleAutoDetectTheme = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
      setSuccessMessage(t('settings.status.themeSynced').replace('{mode}', isDarkMode ? t('settings.appearance.modes.midnight.label') : t('settings.appearance.modes.solaris.label')));
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  const navItems = [
    { id: 'profile', label: t('settings.tab.identity'), icon: User, desc: t('settings.nav.identity.desc') },
    { id: 'appearance', label: t('settings.tab.visuals'), icon: Layout, desc: t('settings.nav.visuals.desc') },
    { id: 'notifications', label: t('settings.tab.alerts'), icon: Bell, desc: t('settings.nav.alerts.desc') },
    { id: 'security', label: t('settings.tab.security'), icon: Lock, desc: t('settings.nav.security.desc') },
    { id: 'preferences', label: t('settings.tab.regional'), icon: Globe, desc: t('settings.nav.regional.desc') },
  ];

  if (isProfileLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <Loader2 className={cn("w-12 h-12 animate-spin", theme.colors.accent)} />
              <p className={cn("font-black text-xs uppercase tracking-widest opacity-40", theme.colors.textMuted)}>{t('settings.loadingProfile')}</p>
          </div>
      )
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 md:px-0">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-3", theme.colors.primaryMuted, theme.colors.accent)}>
             {t('settings.systemConfiguration')}
          </div>
          <h1 className={cn("text-5xl font-black tracking-tighter leading-none", theme.colors.text)}>
            {t('settings.title').split(' ')[0]} <span className={theme.colors.accent}>{t('settings.title').split(' ')[1]}</span>
          </h1>
          <p className={cn("text-lg font-medium opacity-60 max-w-md", theme.colors.text)}>
            {t('settings.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className={cn(
                    "px-10 py-5 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50",
                    theme.colors.primary
                )}
            >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('settings.syncChanges')}
            </button>
        </div>
      </header>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black text-xs uppercase tracking-widest border border-white/20"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black text-xs uppercase tracking-widest border border-white/20"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
            </div>
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Pro Navigation */}
        <div className="lg:col-span-4 space-y-3">
          <div className={cn("p-2 rounded-[2.5rem] border transition-colors", theme.colors.surface, theme.colors.border)}>
            {navItems.map((item) => (
                <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={cn(
                    "w-full flex items-center gap-5 p-5 rounded-[2rem] text-left transition-all duration-300 relative group",
                    activeTab === item.id 
                    ? "bg-slate-100 dark:bg-slate-800 shadow-inner"
                    : "hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100"
                )}
                >
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    activeTab === item.id ? theme.colors.primary : cn(theme.colors.bg, "border shadow-sm", theme.colors.border)
                )}>
                    <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : theme.colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("font-black text-[11px] uppercase tracking-widest", theme.colors.text)}>{item.label}</p>
                    <p className={cn("text-[10px] font-bold truncate opacity-50", theme.colors.textMuted)}>{item.desc}</p>
                </div>
                {activeTab === item.id && (
                    <motion.div layoutId="active-nav-indicator" className={cn("absolute right-4 w-1.5 h-6 rounded-full", theme.colors.primary)} />
                )}
                </button>
            ))}
          </div>

          <div className="pt-6 px-6 flex items-center justify-between">
              <button 
                onClick={signOut}
                className="flex items-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
              >
                  <LogOut className="w-4 h-4" />
                  {t('settings.terminateSession')}
              </button>
              <p className={cn("text-[9px] font-black uppercase opacity-20 tracking-tighter", theme.colors.text)}>v0.1.0-alpha</p>
          </div>
        </div>

        {/* Pro Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'profile' && (
                <>
                  <section className={cn("p-10 rounded-[3rem] border shadow-2xl space-y-10 transition-colors", theme.colors.surface, theme.colors.border)}>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group cursor-pointer">
                            <div className={cn("w-36 h-32 rounded-[2.5rem] flex items-center justify-center border-4 shadow-2xl transition-all group-hover:rotate-3 group-hover:scale-105", theme.colors.bg, theme.colors.border)}>
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} className="w-full h-full object-cover rounded-[2rem]" alt="Avatar" />
                                ) : (
                                    <User className={cn("w-14 h-14 opacity-20", theme.colors.text)} />
                                )}
                            </div>
                            <div className={cn("absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border-4", theme.colors.primary, theme.colors.surface)}>
                                <Camera className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <h2 className={cn("text-3xl font-black tracking-tight", theme.colors.text)}>{t('settings.profile.title')}</h2>
                                <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">{t('settings.verified')}</div>
                            </div>
                            <p className={cn("text-sm font-medium opacity-50", theme.colors.text)}>{t('settings.profile.desc')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-3">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 flex items-center gap-2", theme.colors.textMuted)}>
                            {t('settings.profile.name')}
                        </label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder={t('settings.profile.namePlaceholder')}
                          className={cn("w-full px-6 py-5 rounded-3xl border font-bold text-sm focus:ring-[12px] focus:ring-primary/5 outline-none transition-all shadow-sm", theme.colors.bg, theme.colors.border, theme.colors.text)}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 flex items-center gap-2", theme.colors.textMuted)}>
                            {t('settings.profile.phone')}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                            <input 
                                type="tel" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder={t('settings.profile.phonePlaceholder')}
                                className={cn("w-full pl-14 pr-6 py-5 rounded-3xl border font-bold text-sm focus:ring-[12px] focus:ring-primary/5 outline-none transition-all shadow-sm", theme.colors.bg, theme.colors.border, theme.colors.text)}
                            />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-2">
                            <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme.colors.textMuted)}>{t('settings.profile.bio')}</label>
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{formData.bio.length} / 500</span>
                        </div>
                        <textarea 
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            placeholder={t('settings.profile.bioPlaceholder')}
                            maxLength={500}
                            className={cn("w-full px-8 py-7 rounded-[2.5rem] border font-medium text-sm focus:ring-[12px] focus:ring-primary/5 outline-none transition-all h-40 resize-none shadow-sm", theme.colors.bg, theme.colors.border, theme.colors.text)}
                        />
                    </div>
                  </section>
                  
                  {/* Account Metadata */}
                  <section className={cn("p-10 rounded-[3rem] border shadow-xl space-y-8 transition-colors", theme.colors.surface, theme.colors.border)}>
                    <div className="flex items-center gap-4">
                        <Shield className={cn("w-6 h-6", theme.colors.accent)} />
                        <h2 className={cn("text-2xl font-black", theme.colors.text)}>{t('settings.status.title')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-[2rem] border flex items-center gap-5 transition-colors", theme.colors.bg, theme.colors.border)}>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                <SiGoogle className="text-xl text-[#4285F4]" />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("font-black text-[11px] uppercase tracking-widest", theme.colors.text)}>{t('settings.googleAuth')}</p>
                                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className={cn("p-6 rounded-[2rem] border flex items-center gap-5 transition-colors", theme.colors.bg, theme.colors.border)}>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", theme.colors.surface)}>
                                <Clock className={cn("w-5 h-5 opacity-40", theme.colors.text)} />
                            </div>
                            <div>
                                <p className={cn("font-black text-[11px] uppercase tracking-widest", theme.colors.text)}>{t('settings.memberSince')}</p>
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest", theme.colors.textMuted)}>
                                    {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'appearance' && (
                <section className={cn("p-12 rounded-[3rem] border shadow-2xl space-y-12 transition-colors", theme.colors.surface, theme.colors.border)}>
                  <div className="flex items-center gap-6">
                    <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl", theme.colors.primaryMuted)}>
                      <Sun className={cn("w-8 h-8", theme.colors.accent)} />
                    </div>
                    <div>
                      <h2 className={cn("text-3xl font-black tracking-tight", theme.colors.text)}>{t('settings.appearance.title')}</h2>
                      <p className={cn("text-sm font-medium opacity-50", theme.colors.text)}>{t('settings.appearance.desc')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                      { type: 'light', label: t('settings.appearance.modes.solaris.label'), desc: t('settings.appearance.modes.solaris.desc'), icon: Sun, color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
                      { type: 'dark', label: t('settings.appearance.modes.midnight.label'), desc: t('settings.appearance.modes.midnight.desc'), icon: Moon, color: 'bg-indigo-600', shadow: 'shadow-indigo-600/20' }
                    ].map((mode) => (
                      <button
                        key={mode.type}
                        onClick={() => setTheme(mode.type as any)}
                        className={cn(
                          "group p-10 rounded-[3rem] border-4 transition-all text-left space-y-6 relative overflow-hidden",
                          themeType === mode.type 
                            ? (mode.type === 'light' ? "border-orange-500 bg-orange-500/[0.05]" : "border-indigo-500 bg-indigo-500/[0.05]")
                            : cn(theme.colors.border, "hover:border-slate-300 dark:hover:border-slate-700")
                        )}
                      >
                        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110", mode.color, mode.shadow)}>
                          <mode.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className={cn("font-black text-base uppercase tracking-[0.2em]", themeType === mode.type ? (mode.type === 'light' ? "text-orange-600" : "text-indigo-400") : theme.colors.text)}>{mode.label}</p>
                          <p className={cn("text-xs font-bold opacity-60 uppercase tracking-widest", theme.colors.textMuted)}>{mode.desc}</p>
                        </div>
                        
                        {themeType === mode.type && (
                            <div className={cn("absolute top-8 right-8 w-4 h-4 rounded-full animate-pulse", mode.color)} />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className={cn("p-10 rounded-[2.5rem] border border-dashed flex flex-col items-center text-center gap-6 transition-all", theme.colors.border, "hover:bg-black/5 dark:hover:bg-white/5")}>
                      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center", theme.colors.surface, theme.colors.border, "border")}>
                        <Smartphone className={cn("w-8 h-8 opacity-40", theme.colors.text)} />
                      </div>
                      <div className="space-y-2">
                          <p className={cn("text-sm font-black uppercase tracking-[0.2em]", theme.colors.text)}>{t('settings.appearance.syncWithOS')}</p>
                          <p className={cn("text-xs font-medium opacity-50 max-w-[280px] leading-relaxed", theme.colors.textMuted)}>{t('settings.appearance.syncDesc')}</p>
                      </div>
                      <button 
                        onClick={handleAutoDetectTheme}
                        className={cn("px-10 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", theme.colors.border, theme.colors.text, "hover:opacity-60")}
                      >
                          {t('settings.activateAutoDetect')}
                      </button>
                  </div>
                </section>
              )}

              {activeTab === 'notifications' && (
                <section className={cn("p-12 rounded-[3rem] border shadow-2xl space-y-12 transition-colors", theme.colors.surface, theme.colors.border)}>
                   <div className="flex items-center gap-6">
                    <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl", theme.colors.primaryMuted)}>
                      <Bell className={cn("w-8 h-8", theme.colors.accent)} />
                    </div>
                    <div>
                      <h2 className={cn("text-3xl font-black tracking-tight", theme.colors.text)}>{t('settings.notifications.title')}</h2>
                      <p className={cn("text-sm font-medium opacity-50", theme.colors.text)}>{t('settings.notifications.desc')}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { id: 'email', label: t('settings.notifications.email.label'), desc: t('settings.notifications.email.desc'), icon: MailQuestion, state: formData.notificationPreferences.email, key: 'email' },
                      { id: 'push', label: t('settings.notifications.push.label'), desc: t('settings.notifications.push.desc'), icon: Smartphone, state: formData.notificationPreferences.push, key: 'push' },
                      { id: 'marketing', label: t('settings.notifications.marketing.label'), desc: t('settings.notifications.marketing.desc'), icon: Zap, state: formData.notificationPreferences.marketing, key: 'marketing' },
                    ].map((toggle) => (
                        <div key={toggle.id} className={cn("flex items-center justify-between p-10 rounded-[3rem] border transition-all hover:scale-[1.01] hover:shadow-lg", theme.colors.bg, theme.colors.border)}>
                            <div className="flex items-center gap-8">
                                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-sm", theme.colors.surface, theme.colors.border)}>
                                    <toggle.icon className={cn("w-7 h-7 opacity-30", theme.colors.text)} />
                                </div>
                                <div className="space-y-2">
                                    <p className={cn("font-black text-base uppercase tracking-widest", theme.colors.text)}>{toggle.label}</p>
                                    <p className={cn("text-[11px] font-medium opacity-50 leading-relaxed max-w-[260px]", theme.colors.textMuted)}>{toggle.desc}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFormData({
                                    ...formData, 
                                    notificationPreferences: {
                                        ...formData.notificationPreferences,
                                        [toggle.key as keyof typeof formData.notificationPreferences]: !toggle.state
                                    }
                                })}
                                className={cn(
                                    "w-16 h-9 rounded-full relative transition-all duration-300 p-1.5",
                                    toggle.state ? theme.colors.primary : "bg-slate-200 dark:bg-slate-800"
                                )}
                            >
                                <motion.div 
                                    animate={{ x: toggle.state ? 28 : 0 }}
                                    className="w-6 h-6 rounded-full bg-white shadow-xl"
                                />
                            </button>
                        </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'security' && (
                <div className="space-y-10">
                    <section className={cn("p-12 rounded-[3rem] border shadow-2xl space-y-12 transition-colors", theme.colors.surface, theme.colors.border)}>
                        <div className="flex items-center gap-6">
                            <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl", theme.colors.primaryMuted)}>
                            <Key className={cn("w-8 h-8", theme.colors.accent)} />
                            </div>
                            <div>
                            <h2 className={cn("text-3xl font-black tracking-tight", theme.colors.text)}>{t('settings.security.title')}</h2>
                            <p className={cn("text-sm font-medium opacity-50", theme.colors.text)}>{t('settings.security.desc')}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", theme.colors.textMuted)}>{t('settings.security.newPassword')}</label>
                                    <input 
                                        type="password" 
                                        value={securityData.password}
                                        onChange={(e) => setSecurityData({...securityData, password: e.target.value})}
                                        placeholder="••••••••" 
                                        className={cn("w-full px-8 py-6 rounded-3xl border font-bold text-sm outline-none transition-all focus:ring-[12px] focus:ring-primary/5", theme.colors.bg, theme.colors.border, theme.colors.text)} 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", theme.colors.textMuted)}>{t('settings.security.confirmPassword')}</label>
                                    <input 
                                        type="password" 
                                        value={securityData.confirmPassword}
                                        onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                                        placeholder="••••••••" 
                                        className={cn("w-full px-8 py-6 rounded-3xl border font-bold text-sm outline-none transition-all focus:ring-[12px] focus:ring-primary/5", theme.colors.bg, theme.colors.border, theme.colors.text)} 
                                    />
                                </div>
                            </div>
                            <div className={cn("p-8 rounded-[2.5rem] border bg-amber-500/5 border-amber-500/10 flex items-start gap-5")}>
                                <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                <div className="space-y-2">
                                    <p className="font-black text-[11px] uppercase tracking-widest text-amber-600">{t('settings.security.proTip.title')}</p>
                                    <p className={cn("text-xs font-medium leading-relaxed opacity-80", theme.colors.text)}>{t('settings.security.proTip.body')}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleUpdatePassword}
                                disabled={isUpdatingPassword}
                                className={cn("w-full py-6 rounded-[2rem] border-4 font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] flex items-center justify-center gap-3", theme.colors.border, theme.colors.text)}
                            >
                                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                {t('settings.security.cycleKeys')}
                            </button>
                        </div>
                    </section>
                    
                    <section className={cn("p-12 rounded-[3.5rem] border border-red-500/20 bg-red-500/[0.03] space-y-10 relative overflow-hidden")}>
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                             <Trash2 className="w-40 h-40 text-red-500" />
                        </div>
                        <div className="flex items-center gap-6 text-red-500 relative z-10">
                            <div className="w-16 h-16 rounded-[2rem] bg-red-500/10 flex items-center justify-center">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight">{t('settings.termination.title')}</h2>
                                <p className="text-sm font-medium opacity-70">{t('settings.termination.desc')}</p>
                            </div>
                        </div>
                        <div className="p-10 rounded-[3rem] border-2 border-red-500/20 bg-red-500/5 space-y-8 relative z-10">
                             <div className="space-y-2">
                                <p className="font-black text-lg uppercase tracking-tight text-red-600">{t('settings.termination.sectionTitle')}</p>
                                <p className="text-sm font-bold opacity-60 text-red-600/60 leading-relaxed">{t('settings.termination.sectionDesc')}</p>
                             </div>
                             <button 
                                onClick={handleDeleteAccount}
                                disabled={isDeletingAccount}
                                className="w-full py-5 rounded-[2rem] bg-red-500 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-2xl shadow-red-500/40 active:scale-95 flex items-center justify-center gap-3"
                             >
                                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {t('settings.termination.initiate')}
                             </button>
                        </div>
                    </section>
                </div>
              )}

              {activeTab === 'preferences' && (
                <section className={cn("p-12 rounded-[3rem] border shadow-2xl space-y-12 transition-colors", theme.colors.surface, theme.colors.border)}>
                    <div className="flex items-center gap-6">
                        <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl", theme.colors.primaryMuted)}>
                            <Globe className={cn("w-8 h-8", theme.colors.accent)} />
                        </div>
                        <div>
                            <h2 className={cn("text-3xl font-black tracking-tight", theme.colors.text)}>{t('settings.preferences.title')}</h2>
                            <p className={cn("text-sm font-medium opacity-50", theme.colors.text)}>{t('settings.preferences.desc')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 flex items-center gap-2", theme.colors.textMuted)}>
                                <Languages className="w-3.5 h-3.5" />
                                {t('settings.systemLanguage')}
                            </label>
                            <select 
                                value={formData.language}
                                onChange={(e) => {
                                    const newLang = e.target.value as any;
                                    setFormData({...formData, language: newLang});
                                    setLanguage(newLang);
                                }}
                                className={cn("w-full px-8 py-6 rounded-[2rem] border font-bold text-sm outline-none appearance-none cursor-pointer focus:ring-[12px] focus:ring-primary/5 transition-all shadow-sm", theme.colors.bg, theme.colors.border, theme.colors.text)}
                            >
                                <option value="English (US)">{t('settings.languages.en')}</option>
                                <option value="Spanish">{t('settings.languages.es')}</option>
                                <option value="French">{t('settings.languages.fr')}</option>
                                <option value="German">{t('settings.languages.de')}</option>
                                <option value="Japanese">{t('settings.languages.ja')}</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 flex items-center gap-2", theme.colors.textMuted)}>
                                <Clock className="w-3.5 h-3.5" />
                                {t('settings.timezoneOffset')}
                            </label>
                            <select 
                                value={formData.timezone}
                                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                                className={cn("w-full px-8 py-6 rounded-[2rem] border font-bold text-sm outline-none appearance-none cursor-pointer focus:ring-[12px] focus:ring-primary/5 transition-all shadow-sm", theme.colors.bg, theme.colors.border, theme.colors.text)}
                            >
                                <option>{formData.timezone}</option>
                                <option>UTC +05:30 (IST)</option>
                                <option>UTC +00:00 (GMT)</option>
                                <option>UTC -05:00 (EST)</option>
                                <option>UTC -08:00 (PST)</option>
                                <option>UTC +09:00 (JST)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className={cn("p-10 rounded-[3rem] border border-dashed flex items-center justify-between gap-10 transition-colors", theme.colors.border, "hover:bg-black/5 dark:hover:bg-white/5")}>
                        <div className="flex items-center gap-8">
                            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-sm", theme.colors.surface)}>
                                <Globe className={cn("w-7 h-7 opacity-30", theme.colors.text)} />
                            </div>
                            <div className="space-y-2">
                                <p className={cn("font-black text-base uppercase tracking-widest", theme.colors.text)}>{t('settings.automaticDetection')}</p>
                                <p className={cn("text-xs font-medium opacity-50 leading-relaxed max-w-[280px]", theme.colors.textMuted)}>{t('settings.preferences.autoScanDesc')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleAutoScan}
                            className={cn("text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-50 flex items-center gap-2 px-6 py-2 rounded-xl border-2", theme.colors.accent, theme.colors.border)}
                        >
                            {t('settings.rescan')}
                        </button>
                    </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
