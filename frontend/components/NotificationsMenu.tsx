"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Check, X } from 'lucide-react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '../lib/dateUtils';
import { useAppTheme } from './providers/ThemeProvider';
import { cn } from '@/lib/cn';

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  data?: string;
};

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    loadNotifications();
    // Poll every 10 seconds
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
      // Data might be a string (JSON) or an object depending on how it's handled by the client
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
          router.push('/notifications');
      }
    } catch (err) {
      console.error('Failed to parse notification data', err);
      router.push('/notifications');
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
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
            className="fixed md:absolute top-16 md:top-auto right-4 md:right-0 md:mt-2 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100]"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '400px',
            }}
          >
            {/* Header */}
            <div className={cn("border-b border-slate-200 p-4 flex items-center justify-between", theme.colors.primaryMuted)}>
              <div>
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <p className="text-sm text-slate-600">{unreadCount} unread</p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className={cn("p-1 hover:bg-white rounded text-slate-600 hover:text-primary transition-colors text-sm")}
                      title="Mark all as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAll()}
                    className="p-1 hover:bg-white rounded text-slate-600 hover:text-red-600 transition-colors text-sm"
                    title="Delete all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No notifications</p>
                  <p className="text-sm text-slate-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                        !notif.isRead && theme.colors.primaryMuted
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 text-sm">
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <div className={cn("w-2 h-2 rounded-full", theme.colors.primary)} />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDateTime(notif.createdAt)}
                          </p>
                        </div>

                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className={cn("p-1 hover:bg-white rounded text-slate-400 hover:text-primary transition-colors")}
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-slate-50 border-t border-slate-200 p-3 text-center">
                <a
                  href="/notifications"
                  className={cn("text-sm font-medium hover:opacity-80 transition-colors", theme.colors.accent)}
                >
                  View All Notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
