import React, { useState, useEffect } from 'react';
import { BellRing, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) setNotifications(res.data);
      else if (res.data?.data) setNotifications(res.data.data);
      else setNotifications([]);
    } catch (err) {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications Center</h1>
        <button
          onClick={markAllAsRead}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No notifications. You're all caught up!</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
          {notifications.map(notif => (
            <div key={notif.id} className={`p-4 flex items-start ${!notif.isRead ? 'bg-indigo-50/50' : ''}`}>
              <div className="mt-1 mr-4">
                <BellRing className={`w-5 h-5 ${!notif.isRead ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                  {notif.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
