"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { formatDateTime } from '../../lib/dateUtils';
import { useAppTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/cn';

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  readAt?: number;
  data?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
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
          // Stay on page
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
    <div>
      <main className="min-h-screen">
          {/* Header */}
          <div className="py-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={cn("text-3xl font-bold", theme.colors.text)}>Notifications</h1>
                <p className={cn("mt-1", theme.colors.textMuted)}>{unreadCount} unread messages</p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={markAllAsRead}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium bg-indigo-500 hover:bg-indigo-600"
                    >
                      <Check className="w-4 h-4" />
                      Mark All as Read
                    </motion.button>
                  )}
                  <motion.button
                    onClick={deleteAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </motion.button>
                </div>
              )}
            </div>
          </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Bell className={cn("w-8 h-8", theme.colors.textMuted)} />
            </div>
            <p className={cn("mt-4 font-medium", theme.colors.textMuted)}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={cn("rounded-xl shadow-sm border p-12 text-center", theme.colors.surface, theme.colors.border)}>
            <Bell className={cn("w-16 h-16 mx-auto mb-4", theme.colors.textMuted)} />
            <h2 className={cn("text-2xl font-bold mb-2", theme.colors.text)}>No notifications yet</h2>
            <p className={cn("mb-6", theme.colors.textMuted)}>You're all caught up! Check back later.</p>
            <motion.button
              onClick={() => router.push('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn("px-4 py-2 text-white rounded-lg font-medium", theme.colors.primary)}
            >
              Go to Dashboard
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "rounded-xl shadow-sm border transition-all p-6 flex items-start justify-between gap-4 hover:shadow-md cursor-pointer",
                  theme.colors.surface,
                  theme.colors.border,
                  !notif.isRead && "border-indigo-500/50 bg-indigo-500/10"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={cn("font-semibold text-lg", theme.colors.text)}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <div className={cn("px-2 py-1 text-white text-xs rounded-full font-medium", theme.colors.primary)}>
                        New
                      </div>
                    )}
                  </div>
                  <p className={cn("mb-3", theme.colors.text)}>{notif.message}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", theme.colors.textMuted)}>
                      {formatDateTime(notif.createdAt)}
                    </span>
                    {notif.readAt && (
                      <span className={cn("text-xs", theme.colors.textMuted)}>
                        Read {formatDateTime(notif.readAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!notif.isRead && (
                    <motion.button
                      onClick={() => markAsRead(notif.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn("p-2 rounded-lg transition-colors", theme.colors.textMuted, "hover:bg-indigo-100 hover:text-indigo-600")}
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => deleteNotification(notif.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn("p-2 rounded-lg transition-colors", theme.colors.textMuted, "hover:bg-red-100 hover:text-red-600")}
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
