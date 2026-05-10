"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

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
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                <p className="text-slate-600 mt-1">{unreadCount} unread messages</p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={markAllAsRead}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
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
                <Bell className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-slate-600 mt-4 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No notifications yet</h2>
              <p className="text-slate-600 mb-6">You're all caught up! Check back later.</p>
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
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
                  className={`bg-white rounded-xl shadow-sm border transition-all p-6 flex items-start justify-between gap-4 hover:shadow-md ${
                    !notif.isRead
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                          New
                        </div>
                      )}
                    </div>
                    <p className="text-slate-700 mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {notif.readAt && (
                        <span className="text-xs text-slate-400">
                          Read {new Date(notif.readAt).toLocaleDateString()}
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
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => deleteNotification(notif.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
