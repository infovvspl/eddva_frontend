import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createNotificationSocket } from "@/lib/notification-socket";
import api from "@/lib/api/school-client";
import { useAuth } from "@/context/SchoolAuthContext";

export interface NotificationPreferences {
  desktopNotificationsEnabled: boolean;
  soundEnabled: boolean;
  doNotDisturb: boolean;
  chatNotificationsEnabled: boolean;
  announcementAlerts: boolean;
  attendanceAlerts: boolean;
  assignmentAlerts: boolean;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: any[];
  permission: NotificationPermission;
  showPermissionBanner: boolean;
  settings: NotificationPreferences;
  requestPermission: () => Promise<void>;
  dismissBanner: () => void;
  toggleSetting: (key: keyof NotificationPreferences) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API soft double-beep chime
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, time);
      osc.type = "sine";
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    };
    const now = ctx.currentTime;
    playBeep(now, 587.33, 0.18); // D5
    playBeep(now + 0.1, 880, 0.22); // A5
  } catch (e) {
    console.error("Audio synthesis failed:", e);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default"
  );
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);

  const [settings, setSettings] = useState<NotificationPreferences>({
    desktopNotificationsEnabled: true,
    soundEnabled: true,
    doNotDisturb: false,
    chatNotificationsEnabled: true,
    announcementAlerts: true,
    attendanceAlerts: true,
    assignmentAlerts: true,
  });

  const originalTitleRef = useRef<string>(document.title);
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sync preferences from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("eddva-notification-prefs");
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch (e) {
        console.error("Failed to parse local storage notification prefs", e);
      }
    }
  }, []);

  // Fetch unread count, notifications list, and sync preferences from backend
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data?.success) {
        setUnreadCount(res.data.count);
      }
    } catch (e) {
      console.error("Failed to fetch unread count:", e);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const fetchPreferences = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications/preferences");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        const mappedPrefs: NotificationPreferences = {
          desktopNotificationsEnabled: d.enablePush ?? true,
          soundEnabled: d.enableInApp ?? true, // maps backend's enableInApp/enableEmail to frontend preferences
          doNotDisturb: d.feeAlerts === false, // We'll map DND to feeAlerts or store client-side
          chatNotificationsEnabled: d.liveClassAlerts ?? true,
          announcementAlerts: d.announcementAlerts ?? true,
          attendanceAlerts: d.attendanceAlerts ?? true,
          assignmentAlerts: d.assignmentAlerts ?? true,
        };
        setSettings(mappedPrefs);
        localStorage.setItem("eddva-notification-prefs", JSON.stringify(mappedPrefs));
      }
    } catch (e) {
      console.error("Failed to fetch notification preferences:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUnreadCount();
      fetchNotifications();
      fetchPreferences();

      // Show banner if permission is default and not dismissed this session
      if (Notification.permission === "default" && !sessionStorage.getItem("eddva-notif-banner-dismissed")) {
        setShowPermissionBanner(true);
      }
    }
  }, [isAuthenticated, user?.id]);

  // Handle browser tab title badging & blinking
  useEffect(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }

    if (unreadCount > 0) {
      const baseTitle = originalTitleRef.current;
      let showBadge = true;
      titleIntervalRef.current = setInterval(() => {
        document.title = showBadge ? `(${unreadCount}) ${baseTitle}` : baseTitle;
        showBadge = !showBadge;
      }, 1500);
    } else {
      document.title = originalTitleRef.current;
    }

    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, [unreadCount]);

  // Connect Socket.IO to /notifications namespace
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let socket: ReturnType<typeof createNotificationSocket> | null = null;
    const connectTimer = window.setTimeout(() => {
      socket = createNotificationSocket();
      socket.emit("join_user", user.id);

      socket.on("new_notification", (newNotif: any) => {
        const currentSettings = settingsRef.current;

        // 1. DND filtering
        if (currentSettings.doNotDisturb) return;

        // 2. Type-specific preferences check
        const type = (newNotif.type || newNotif.category || "").toLowerCase();
        if (type === "chat" && !currentSettings.chatNotificationsEnabled) return;
        if ((type.includes("announcement") || type.includes("notice")) && !currentSettings.announcementAlerts) return;
        if (type.includes("attendance") && !currentSettings.attendanceAlerts) return;
        if (type.includes("assignment") && !currentSettings.assignmentAlerts) return;

        // 3. Active Conversation Thread Check
        // If user is actively chatting with the sender of this message, don't show OS notification or play sound
        const activePeerId = (window as any).activeChatPeerId;
        const notifSenderId = newNotif.senderId || newNotif.userId;
        if (type === "chat" && activePeerId && String(activePeerId) === String(notifSenderId)) {
          // Just refresh list & unread count inside the app without disturbing the user
          setNotifications(prev => [newNotif, ...prev]);
          return;
        }

        // 4. Update state
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // 5. Play Sound
        if (currentSettings.soundEnabled) {
          playChime();
        }

        // 6. Native Desktop Notification if page is hidden/inactive
        if (currentSettings.desktopNotificationsEnabled && Notification.permission === "granted") {
          if (document.hidden || !document.hasFocus()) {
            const desktopNotif = new Notification(newNotif.title, {
              body: newNotif.message,
              icon: "/logo.png", // fallback icon
              tag: newNotif.id,
            });

            desktopNotif.onclick = () => {
              window.parent.focus();
              window.focus();
              if (newNotif.id) {
                api.patch(`/school/notifications/${newNotif.id}/read`).catch(() => {});
              }
              if (newNotif.actionUrl) {
                navigate(newNotif.actionUrl);
              }
              desktopNotif.close();
            };
          }
        }
      });
    }, 0);

    return () => {
      window.clearTimeout(connectTimer);
      socket?.disconnect();
    };
  }, [isAuthenticated, user?.id, navigate]);

  const requestPermission = async () => {
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      setShowPermissionBanner(false);
      if (res === "granted") {
        // Send a test desktop alert
        new Notification("Notifications Enabled", {
          body: "You will now receive real-time alerts from Eddva ERP.",
          icon: "/logo.png",
        });
      }
    } catch (e) {
      console.error("Permission request failed:", e);
    }
  };

  const dismissBanner = () => {
    setShowPermissionBanner(false);
    sessionStorage.setItem("eddva-notif-banner-dismissed", "true");
  };

  const toggleSetting = async (key: keyof NotificationPreferences) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem("eddva-notification-prefs", JSON.stringify(updated));

    // Persist to backend preferences endpoint
    if (isAuthenticated) {
      try {
        await api.put("/notifications/preferences", {
          enablePush: updated.desktopNotificationsEnabled,
          enableInApp: updated.soundEnabled,
          announcementAlerts: updated.announcementAlerts,
          attendanceAlerts: updated.attendanceAlerts,
          assignmentAlerts: updated.assignmentAlerts,
          liveClassAlerts: updated.chatNotificationsEnabled, // maps chat to live class alerts key
          feeAlerts: !updated.doNotDisturb, // maps DND to feeAlerts
        });
      } catch (e) {
        console.error("Failed to update preferences on backend:", e);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        permission,
        showPermissionBanner,
        settings,
        requestPermission,
        dismissBanner,
        toggleSetting,
        fetchUnreadCount,
        fetchNotifications,
        setUnreadCount,
        setNotifications,
      }}
    >
      {children}
      {/* Premium Notification Permission Banner UI */}
      {showPermissionBanner && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm rounded-[2rem] border border-slate-100 bg-white/90 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Enable Notifications</h4>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Receive instant desktop alerts when a teacher or parent sends you a message.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={requestPermission}
                  className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Enable
                </button>
                <button
                  onClick={dismissBanner}
                  className="rounded-xl border border-slate-100 px-3.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useSchoolNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useSchoolNotification must be used within a NotificationProvider");
  }
  return context;
};
