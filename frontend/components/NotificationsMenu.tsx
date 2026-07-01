"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Check, X } from 'lucide-react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '../lib/dateUtils';
import { useAppTheme } from './providers/ThemeProvider';
import { useLanguage } from './providers/LanguageProvider';
import { cn } from '@/lib/cn';
import SurfaceDecorations from './shared/SurfaceDecorations';
import type { Notification } from '@/lib/notifications';
import { translateNotification } from '@/lib/notifications';

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.data.unreadCount || 0);
    } catch (err) {
      // Silent fail
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.post('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteAll() {
    try {
      await api.delete('/notifications');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    setOpen(false);

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
        case 'deletion_approved':
        case 'deletion_rejected':
        case 'merge_approved':
        case 'merge_rejected':
          if (data.treeId) router.push(`/tree/${data.treeId}`);
          break;
        case 'relationship_pending':
          router.push('/dashboard/manage/proposals?tab=relationships');
          break;
        case 'claim_request_pending':
          router.push('/dashboard/manage/proposals?tab=claims');
          break;
        case 'deletion_proposal_pending':
          router.push('/dashboard/manage/proposals?tab=deletions');
          break;
        case 'merge_proposal_pending':
          router.push('/dashboard/manage/proposals?tab=merges');
          break;
        default:
          router.push('/notifications');
      }
    } catch (err) {
      console.error('Failed to parse notification data', err);
      router.push('/notifications');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="relative p-2 rounded-xl hover:bg-[#F97316]/5 transition-colors border-2 border-transparent hover:border-[#E2E8F0]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#F97316] text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-[#FFFDF5]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed md:absolute top-16 md:top-auto right-4 md:right-0 md:mt-2 w-[calc(100vw-2rem)] md:w-96 rounded-2xl border-2 shadow-[4px_4px_0px_rgba(15,23,42,0.08)] overflow-hidden z-[100]",
              theme.colors.surface,
              theme.colors.border
            )}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '400px',
            }}
          >
            <SurfaceDecorations density="light" />
            {/* Header */}
            <div className={cn("border-b p-4 flex items-center justify-between", "bg-[#F97316]/5", theme.colors.border)}>
              <div>
                <h3 className={cn("font-bold", theme.colors.text)}>{t('notificationsMenu.title')}</h3>
                <p className={cn("text-sm", theme.colors.textMuted)}>{t('notifications.unreadCount').replace('{count}', String(unreadCount))}</p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className={cn("p-1.5 rounded-lg transition-colors hover:bg-[#F97316]/10 border-2 border-transparent hover:border-[#E2E8F0]")}
                      title={t('notificationsMenu.markAllRead')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAll()}
                    className={cn("p-1.5 rounded-lg transition-colors hover:bg-[#F97316]/10 border-2 border-transparent hover:border-[#E2E8F0] hover:text-red-500")}
                    title={t('notifications.deleteAll')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto", "bg-[#F97316]/10")}>
                    <Bell className={cn("w-8 h-8 opacity-20", theme.colors.text)} />
                  </div>
                  <div className="space-y-1">
                    <p className={cn("font-bold", theme.colors.text)}>{t('notificationsMenu.empty')}</p>
                  </div>
                </div>
              ) : (
                <div className={cn("divide-y", theme.colors.border)}>
                  {notifications.map((notif) => {
                    const { title, message } = translateNotification(notif, t);
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "p-4 transition-colors cursor-pointer",
                          !notif.isRead ? "bg-[#F97316]/5" : "hover:bg-[#F97316]/3"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={cn("font-bold text-sm", theme.colors.text)}>
                                {title}
                              </h4>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className={cn("text-sm mt-1 line-clamp-2", theme.colors.textMuted)}>
                              {message}
                            </p>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-2 opacity-40", theme.colors.text)}>
                              {formatDateTime(notif.createdAt)}
                            </p>
                          </div>

                          <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {!notif.isRead && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className={cn("p-1.5 rounded-lg transition-colors hover:bg-[#F97316]/10 border-2 border-transparent hover:border-[#E2E8F0]")}
                                title={t('notifications.markAsRead')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className={cn("p-1.5 rounded-lg transition-colors hover:bg-[#F97316]/10 border-2 border-transparent hover:border-[#E2E8F0] hover:text-red-500")}
                              title={t('notifications.delete')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={cn("p-3 text-center border-t", "bg-[#F97316]/3", theme.colors.border)}>
                <a
                  href="/notifications"
                  className={cn("text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-colors", "text-[#F97316]")}
                >
                  {t('notificationsMenu.viewAll')}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
