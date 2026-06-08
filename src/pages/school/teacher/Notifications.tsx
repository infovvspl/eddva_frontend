import React, { useEffect, useState } from "react";
import { Bell, Trash2, CheckCircle, CheckCheck } from "lucide-react";
import api from "@/lib/api/school-client";
import useLiveRefresh from "@/hooks/useLiveRefresh";
import { toast } from "sonner";
import "./Notifications.css";

interface Notification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    title: "Assignment Submitted",
    message: "Rahul submitted Assignment 4.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Attendance Updated",
    message: "Attendance marked successfully.",
    time: "10 min ago",
    read: false,
  },
  {
    id: "3",
    title: "New Topic Created",
    message: "AI Fundamentals topic added.",
    time: "1 hour ago",
    read: true,
  },
  {
    id: "4",
    title: "Assessment Completed",
    message: "Semester Test evaluation completed.",
    time: "3 hours ago",
    read: true,
  },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    try {
      const [noticesRes, notificationsRes] = await Promise.allSettled([
        api.get('/notices'),
        api.get('/notifications'),
      ]);

      const nextNotifications: Notification[] = [];

      if (noticesRes.status === 'fulfilled') {
        const notices = noticesRes.value.data?.data ?? noticesRes.value.data ?? [];
        if (Array.isArray(notices)) {
          notices.slice(0, 8).forEach((notice: any, index: number) => {
            nextNotifications.push({
              id: notice.id || `notice-${index}`,
              title: notice.title || 'Notice',
              message: notice.content || notice.category || 'New institute notice published.',
              time: notice.postedDate ? new Date(notice.postedDate).toLocaleString() : 'Just now',
              read: false,
            });
          });
        }
      }

      if (notificationsRes.status === 'fulfilled') {
        const items = notificationsRes.value.data?.data ?? notificationsRes.value.data ?? [];
        if (Array.isArray(items)) {
          items.forEach((item: any, index: number) => {
            nextNotifications.push({
              id: item.id || `notif-${index}`,
              title: item.title || 'Notification',
              message: item.message || item.content || 'Institute update available.',
              time: item.time || item.createdAt || item.created_at || 'Just now',
              read: Boolean(item.isRead ?? item.read),
            });
          });
        }
      }

      if (nextNotifications.length > 0) {
        setNotifications(nextNotifications);
        return;
      }
    } catch (error) {
      console.error('Notification sync error:', error);
    }

    try {
      const stored = localStorage.getItem("teacher_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
          return;
        }
      }
    } catch (error) {
      console.error("Notification parsing error:", error);
      localStorage.removeItem("teacher_notifications");
    }

    setNotifications(defaultNotifications);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useLiveRefresh(loadNotifications, [], 30000);

  useEffect(() => {
    localStorage.setItem(
      "teacher_notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  const markAsRead = async (id: string | number) => {
    try {
      if (typeof id === 'string' && !id.startsWith('notice-') && !id.startsWith('notif-')) {
        await api.patch(`/notifications/${id}/read`);
      }
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const deleteNotification = async (id: string | number) => {
    try {
      if (typeof id === 'string' && !id.startsWith('notice-') && !id.startsWith('notif-')) {
        await api.delete(`/notifications/${id}`);
      }
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id),
      );
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification", error);
      toast.error("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read", error);
      toast.error("Failed to mark all as read");
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {hasUnread && (
          <button onClick={markAllAsRead} className="mark-all-btn">
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${
                !notification.read ? "notification-card--unread" : ""
              }`}
            >
              <div className="notification-left">
                <Bell size={20} />
              </div>

              <div className="notification-content">
                <h3>{notification.title}</h3>

                <p>{notification.message}</p>

                <span>{notification.time}</span>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button onClick={() => markAsRead(notification.id)} title="Mark as read">
                    <CheckCircle size={18} />
                  </button>
                )}

                <button onClick={() => deleteNotification(notification.id)} title="Delete notification">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="notification-empty">No notifications available</div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

