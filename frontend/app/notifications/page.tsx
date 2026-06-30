"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { formatDateTime } from '../../lib/dateUtils';
import { useAppTheme } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { cn } from '@/lib/cn';
import type { Notification } from '@/lib/notifications';
import { translateNotification } from '@/lib/notifications';
import { Button } from "@/components/ui/button";


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    if (!notif.data) return;

    try {
      const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;

      switch (notif.type) {
        case 'access_request_pending':
          router.push('/dashboard/manage/users');
          break;
        case 'access_request_approved':
        case 'relationship_approved':
        case 'relationship_rejected':
        case 'claim_request_approved':
        case 'claim_request_rejected':
          if (data.treeId) router.push(`/tree/${data.treeId}`);
          break;
        case 'relationship_pending':
          router.push('/dashboard/manage/proposals');
          break;
        case 'claim_request_pending':
          router.push('/dashboard/manage/claims');
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Failed to parse notification data', err);
    }
  };

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.post('/notifications/read-all');
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteAll() {
    try {
      await api.delete('/notifications');
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">

      <main className="relative z-10">
        {/* Header */}
        <div className="py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={cn("text-3xl font-bold", theme.colors.text)}>{t('notifications.title')}</h1>
              <p className={cn("mt-1", theme.colors.textMuted)}>{t('notifications.unreadCount').replace('{count}', String(unreadCount))}</p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <Button variant="candy" size="sm" onClick={markAllAsRead}>
                    <Check className="w-4 h-4" />
                    {t('notifications.markAllRead')}
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={deleteAll}>
                  <Trash2 className="w-4 h-4" />
                  {t('notifications.deleteAll')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {error ? (
          <div className={cn("rounded-2xl border-2 p-12 text-center shadow-pop-sm", "bg-card border-destructive/20")}>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className={cn("text-2xl font-bold mb-2", "text-destructive")}>{t('dataState.error.title')}</h2>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <Button variant="destructive" onClick={() => { setError(null); loadNotifications(); }}>
              {t('dataState.error.retry')}
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="inline-block animate-spin">
              <Bell className={cn("w-8 h-8", theme.colors.textMuted)} />
            </div>
            <p className={cn("mt-4 font-medium", theme.colors.textMuted)}>{t('notifications.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={cn("rounded-2xl border-2 border-dashed p-12 text-center shadow-pop-sm", "bg-card")}>
            <Bell className={cn("w-16 h-16 mx-auto mb-4", "text-muted-foreground")} />
            <h2 className={cn("text-2xl font-bold mb-2", theme.colors.text)}>{t('notifications.noNotifications.title')}</h2>
            <p className={cn("mb-6", theme.colors.textMuted)}>{t('notifications.noNotifications.subtitle')}</p>
            <Button variant="candy" onClick={() => router.push('/dashboard')}>
              {t('notifications.noNotifications.button')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, idx) => {
              const { title, message } = translateNotification(notif, t);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "rounded-2xl border-2 transition-all p-6 flex items-start justify-between gap-4 hover:shadow-pop-sm cursor-pointer",
                    "bg-card border-border",
                    !notif.isRead && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={cn("font-bold text-lg", theme.colors.text)}>
                        {title}
                      </h3>
                      {!notif.isRead && (
                        <div className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-bold">
                          {t('notifications.new')}
                        </div>
                      )}
                    </div>
                    <p className={cn("mb-3", theme.colors.text)}>{message}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm", theme.colors.textMuted)}>
                        {formatDateTime(notif.createdAt)}
                      </span>
                      {notif.readAt && (
                        <span className={cn("text-xs", theme.colors.textMuted)}>
                          {t('notifications.readAt').replace('{date}', formatDateTime(notif.readAt))}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!notif.isRead && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-xl transition-colors text-muted-foreground hover:bg-primary/10 hover:text-primary border-2 border-transparent hover:border-primary/30"
                        title={t('notifications.markAsRead')}
                      >
                        <Check className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive border-2 border-transparent hover:border-destructive/30"
                      title={t('notifications.delete')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
