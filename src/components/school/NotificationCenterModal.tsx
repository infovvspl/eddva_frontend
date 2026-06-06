import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Trash2,
  CheckCircle,
  CheckCheck,
  X,
  Search,
  MoreVertical,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Inbox,
  Check,
  Loader2,
  BookOpen,
  FileText,
  ClipboardList,
  Video,
  CalendarDays,
  CreditCard,
  BarChart3,
  Megaphone,
  AlertTriangle
} from "lucide-react";
import api from "@/lib/api/school-client";
import { createNotificationSocket } from "@/lib/notification-socket";
import { toast } from "sonner";
import "./NotificationCenterModal.css";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; role: string; name: string };
  onUpdate?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "announcement", label: "Announcements" },
  { key: "assignment", label: "Assignments" },
  { key: "assessment", label: "Assessments" },
  { key: "live_class", label: "Live Classes" },
  { key: "study_material", label: "Study Materials" },
  { key: "attendance", label: "Attendance" },
  { key: "fee", label: "Fees" },
  { key: "result", label: "Results" }
];

const categoryIcons: Record<string, React.ReactNode> = {
  announcement: <Megaphone size={16} />,
  assignment: <FileText size={16} />,
  assessment: <ClipboardList size={16} />,
  live_class: <Video size={16} />,
  study_material: <BookOpen size={16} />,
  attendance: <CalendarDays size={16} />,
  fee: <CreditCard size={16} />,
  result: <BarChart3 size={16} />,
  general: <Bell size={16} />
};

export default function NotificationCenterModal({
  isOpen,
  onClose,
  currentUser,
  onUpdate
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // UI state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Preferences state
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    enableInApp: true,
    enableEmail: true,
    enablePush: true,
    assignmentAlerts: true,
    assessmentAlerts: true,
    attendanceAlerts: true,
    announcementAlerts: true,
    liveClassAlerts: true,
    feeAlerts: true
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Handle Search Debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // Load preferences
  const loadPreferences = async () => {
    try {
      setPrefsLoading(true);
      const res = await api.get("/notifications/preferences");
      if (res.data?.success) {
        setPreferences(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
    } finally {
      setPrefsLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async (updatedPrefs: typeof preferences) => {
    try {
      setPrefsLoading(true);
      const res = await api.put("/notifications/preferences", updatedPrefs);
      if (res.data?.success) {
        setPreferences(updatedPrefs);
        toast.success("Preferences updated successfully");
      }
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setPrefsLoading(false);
    }
  };

  // Load notifications
  const fetchNotifications = async (pageNum: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const categoryParam = activeTab === "all" || activeTab === "unread" ? undefined : activeTab;
      const isReadParam = activeTab === "unread" ? "false" : undefined;

      const res = await api.get("/notifications", {
        params: {
          page: pageNum,
          limit: 20,
          category: categoryParam,
          isRead: isReadParam,
          search: debouncedSearch || undefined
        }
      });

      if (res.data?.success) {
        const list: NotificationItem[] = res.data.data;
        const total = res.data.total;

        if (isInitial) {
          setNotifications(list);
          setHasMore(list.length < total);
        } else {
          setNotifications(prev => {
            const nextList = [...prev];
            list.forEach(item => {
              if (!nextList.some(n => n.id === item.id)) {
                nextList.push(item);
              }
            });
            return nextList;
          });
          setHasMore((notifications.length + list.length) < total);
        }
      }
    } catch (err) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data?.success) {
        setTotalUnread(res.data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger loading on filter change
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, true);
      fetchUnreadCount();
      setSelectedIds([]);
    }
  }, [isOpen, activeTab, debouncedSearch]);

  // Handle click outside menu to close
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Real-Time Socket Connection inside modal
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const socket = createNotificationSocket();
    socket.emit("join_user", currentUser.id);

    socket.on("new_notification", (newNotif: any) => {
      // Prepend if matches tab / search filters
      setNotifications(prev => {
        const item: NotificationItem = {
          id: newNotif.id,
          title: newNotif.title,
          message: newNotif.message,
          category: newNotif.category || newNotif.type || 'general',
          priority: newNotif.priority || 'medium',
          isRead: newNotif.isRead || false,
          createdAt: newNotif.createdAt || newNotif.created_at || new Date().toISOString(),
          actionUrl: newNotif.actionUrl
        };
        // Check filtering
        const matchesCategory = activeTab === "all" || activeTab === "unread" || activeTab === item.category;
        const matchesSearch = !debouncedSearch || 
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          item.message.toLowerCase().includes(debouncedSearch.toLowerCase());
        
        if (matchesCategory && matchesSearch) {
          return [item, ...prev];
        }
        return prev;
      });
      setTotalUnread(prev => prev + 1);
      if (onUpdate) onUpdate();
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, currentUser?.id, activeTab, debouncedSearch]);

  // Scroll handler for infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (hasMore && !loading && !loadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage);
      }
    }
  };

  // Actions
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setTotalUnread(prev => Math.max(0, prev - 1));
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
        fetchUnreadCount();
        if (onUpdate) onUpdate();
        toast.success("Notification deleted");
      }
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setTotalUnread(0);
        if (onUpdate) onUpdate();
        toast.success("All marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  // Bulk Actions
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleBulkMarkRead = async () => {
    if (!selectedIds.length) return;
    try {
      const res = await api.patch("/notifications/bulk-read", { ids: selectedIds });
      if (res.data?.success) {
        setNotifications(prev =>
          prev.map(n => selectedIds.includes(n.id) ? { ...n, isRead: true } : n)
        );
        fetchUnreadCount();
        setSelectedIds([]);
        if (onUpdate) onUpdate();
        toast.success("Selected marked as read");
      }
    } catch (err) {
      toast.error("Failed to process bulk request");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      const res = await api.delete("/notifications/bulk-delete", { data: { ids: selectedIds } });
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
        setSelectedIds([]);
        fetchUnreadCount();
        if (onUpdate) onUpdate();
        toast.success("Selected deleted");
      }
    } catch (err) {
      toast.error("Failed to delete selected");
    }
  };

  // Fallback links matching user role
  const getDeepLink = (n: NotificationItem) => {
    if (n.actionUrl) return n.actionUrl;
    const isTeacher = currentUser.role === "TEACHER";
    const isAdmin = currentUser.role === "INSTITUTE_ADMIN";
    const isStudent = currentUser.role === "STUDENT";
    const isParent = currentUser.role === "PARENT";

    const cat = (n.category || '').toLowerCase();
    const title = (n.title || '').toLowerCase();

    if (isTeacher) {
      if (cat.includes("calendar") || cat.includes("event") || title.includes("calendar") || title.includes("event")) return "/school/teacher/calendar";
      if (cat.includes("assignment") || title.includes("assignment")) return "/school/teacher/assignments";
      if (cat.includes("assessment") || title.includes("assessment")) return "/school/teacher/assessments";
      if (cat.includes("class") || title.includes("class")) return "/school/teacher/classes";
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/teacher/attendance";
      return "/school/teacher";
    }

    if (isStudent) {
      if (cat.includes("calendar") || cat.includes("event") || title.includes("calendar") || title.includes("event")) return "/school/student/calendar";
      if (cat.includes("assignment") || title.includes("assignment")) return "/school/student/assignments";
      if (cat.includes("assessment") || title.includes("assessment")) return "/school/student/assessments";
      if (cat.includes("class") || title.includes("class")) return "/school/student/live-classes";
      if (cat.includes("material") || title.includes("material")) return "/school/student/study-materials";
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/student/attendance";
      return "/school/student";
    }

    if (isParent) {
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/parent/child";
      return "/school/parent/dashboard";
    }

    // Default Admin routes
    if (cat.includes("user")) return "/school/admin/users";
    if (cat.includes("calendar") || cat.includes("event") || title.includes("calendar") || title.includes("event")) return "/school/admin/calendar";
    if (cat.includes("class")) return "/school/admin/academics";
    if (cat.includes("notice") || cat.includes("announcement")) return "/school/admin/notices";
    return "/school/admin";
  };

  const handleOpenNotification = (n: NotificationItem) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    const targetUrl = getDeepLink(n);
    if (targetUrl) {
      onClose();
      // Use window.location.href or direct route push
      window.location.href = targetUrl;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="notif-modal-backdrop" onClick={onClose}>
      <div 
        className={`notif-modal-container ${showPreferences ? "notif-modal-container--pref" : ""}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notif-modal-header">
          <div className="notif-header-title-wrapper">
            <h2 className="notif-header-title">Notifications Center</h2>
            <span className="notif-header-subtitle">{totalUnread} Unread Alerts</span>
          </div>

          <div className="notif-header-actions">
            <button 
              onClick={() => {
                setShowPreferences(!showPreferences);
                if (!showPreferences) loadPreferences();
              }} 
              className={`notif-action-btn ${showPreferences ? "notif-action-btn--active" : ""}`}
              title="Notification Preferences"
            >
              <Settings size={18} />
            </button>
            <button onClick={() => fetchNotifications(1, true)} className="notif-action-btn" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button onClick={onClose} className="notif-close-btn" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {showPreferences ? (
          /* Preferences Panel */
          <div className="notif-pref-panel">
            <div className="notif-pref-header">
              <SlidersHorizontal size={18} className="text-indigo-600" />
              <h3>Preferences Settings</h3>
            </div>

            {prefsLoading ? (
              <div className="notif-loading-wrapper">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <p>Loading your preferences...</p>
              </div>
            ) : (
              <div className="notif-pref-content">
                <div className="notif-pref-section">
                  <h4>Delivery Channels</h4>
                  <div className="notif-pref-row">
                    <label>
                      <span>In-App Notifications</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.enableInApp} 
                        onChange={e => savePreferences({ ...preferences, enableInApp: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Email Alerts</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.enableEmail} 
                        onChange={e => savePreferences({ ...preferences, enableEmail: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Push Notifications</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.enablePush} 
                        onChange={e => savePreferences({ ...preferences, enablePush: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>

                <div className="notif-pref-section">
                  <h4>Alert Categories</h4>
                  <div className="notif-pref-row">
                    <label>
                      <span>Assignment Toggles</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.assignmentAlerts} 
                        onChange={e => savePreferences({ ...preferences, assignmentAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Assessment & Exam Updates</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.assessmentAlerts} 
                        onChange={e => savePreferences({ ...preferences, assessmentAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Attendance Disruption Alerts</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.attendanceAlerts} 
                        onChange={e => savePreferences({ ...preferences, attendanceAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>General Announcements</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.announcementAlerts} 
                        onChange={e => savePreferences({ ...preferences, announcementAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Live Classes Timetables</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.liveClassAlerts} 
                        onChange={e => savePreferences({ ...preferences, liveClassAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="notif-pref-row">
                    <label>
                      <span>Fee Due Dates & Receipts</span>
                      <input 
                        type="checkbox" 
                        checked={preferences.feeAlerts} 
                        onChange={e => savePreferences({ ...preferences, feeAlerts: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="notif-pref-footer">
              <button onClick={() => setShowPreferences(false)} className="notif-back-btn">
                Back to Notifications
              </button>
            </div>
          </div>
        ) : (
          /* Main Notifications Panel */
          <>
            {/* Filter bar & Search */}
            <div className="notif-control-bar">
              <div className="notif-search-wrapper">
                <Search className="notif-search-icon" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="notif-search-input"
                />
              </div>

              <div className="notif-tabs-scroll">
                <div className="notif-tabs">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveTab(cat.key)}
                      className={`notif-tab ${activeTab === cat.key ? "notif-tab--active" : ""}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bulk Toolbar */}
            <div className="notif-bulk-toolbar">
              <div className="notif-bulk-left">
                <button onClick={handleSelectAll} className="notif-select-all-btn">
                  <CheckCheck size={14} />
                  {selectedIds.length === notifications.length ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.length > 0 && (
                  <span className="notif-bulk-selected-count">{selectedIds.length} Selected</span>
                )}
              </div>

              <div className="notif-bulk-right">
                {selectedIds.length > 0 ? (
                  <>
                    <button onClick={handleBulkMarkRead} className="notif-bulk-action notif-bulk-action--read">
                      <CheckCircle size={14} />
                      Mark Read
                    </button>
                    <button onClick={handleBulkDelete} className="notif-bulk-action notif-bulk-action--delete">
                      <Trash2 size={14} />
                      Delete Selected
                    </button>
                  </>
                ) : (
                  totalUnread > 0 && (
                    <button onClick={handleMarkAllRead} className="notif-bulk-action notif-bulk-action--all">
                      <CheckCircle size={14} />
                      Mark All Read
                    </button>
                  )
                )}
              </div>
            </div>

            {/* List */}
            <div 
              className="notif-list-container" 
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {loading && page === 1 ? (
                <div className="notif-loading-wrapper">
                  <Loader2 size={36} className="animate-spin text-indigo-600" />
                  <p>Syncing alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty-state">
                  <Bell size={48} className="notif-empty-icon" />
                  <h4>No Notifications Yet</h4>
                  <p>You are all caught up!</p>
                </div>
              ) : (
                <div className="notif-cards-grid">
                  {notifications.map(notif => {
                    const isSelected = selectedIds.includes(notif.id);
                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => handleOpenNotification(notif)}
                        className={`notif-card notif-card--${notif.priority} ${!notif.isRead ? "notif-card--unread" : ""} ${isSelected ? "notif-card--selected" : ""}`}
                      >
                        {/* Checkbox */}
                        <div 
                          className={`notif-checkbox ${isSelected ? "notif-checkbox--checked" : ""}`}
                          onClick={(e) => toggleSelect(notif.id, e)}
                        >
                          {isSelected && <Check size={10} strokeWidth={4} />}
                        </div>

                        {/* Category Icon */}
                        <div className="notif-card-icon-wrapper">
                          {categoryIcons[notif.category] || categoryIcons.general}
                        </div>

                        {/* Text Content */}
                        <div className="notif-card-content">
                          <div className="notif-card-title-row">
                            <h4 className="notif-card-title">{notif.title}</h4>
                            {!notif.isRead && <span className="notif-unread-dot" />}
                          </div>
                          <p className="notif-card-msg">{notif.message}</p>
                          <span className="notif-card-time">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Priority & Operations */}
                        <div className="notif-card-right">
                          <span className={`notif-priority-badge notif-priority-badge--${notif.priority}`}>
                            {notif.priority}
                          </span>

                          <div className="notif-card-menu-wrapper" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === notif.id ? null : notif.id)}
                              className="notif-menu-trigger"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === notif.id && (
                              <div className="notif-dropdown-menu">
                                <button onClick={() => { handleOpenNotification(notif); setActiveMenuId(null); }}>
                                  Open Link
                                </button>
                                {!notif.isRead && (
                                  <button onClick={() => { handleMarkAsRead(notif.id); setActiveMenuId(null); }}>
                                    Mark as Read
                                  </button>
                                )}
                                <button onClick={() => { handleDelete(notif.id); setActiveMenuId(null); }} className="notif-delete-option">
                                  Delete Alert
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {loadingMore && (
                    <div className="notif-scroll-loader">
                      <Loader2 size={20} className="animate-spin text-indigo-600" />
                      <span>Loading more alerts...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
