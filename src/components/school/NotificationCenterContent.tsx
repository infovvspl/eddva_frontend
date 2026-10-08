import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Trash2,
  CheckCircle,
  CheckCheck,
  Search,
  MoreVertical,
  RefreshCw,
  Settings,
  SlidersHorizontal,
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
  BookMarked
  AlertTriangle,
  BookMarked,
  Flag
} from "lucide-react";
import api from "@/lib/api/school-client";
import { createNotificationSocket } from "@/lib/notification-socket";
import { toast } from "sonner";
import { useSchoolNotification } from "@/context/SchoolNotificationContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface NotificationCenterContentProps {
  currentUser: { id: string; role: string; name: string };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isFlag?: boolean;
  createdAt: string;
  actionUrl?: string;
}

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "flag", label: "Flags" },
  { key: "announcement", label: "Announcements" },
  { key: "assignment", label: "Assignments" },
  { key: "assessment", label: "Assessments" },
  { key: "live_class", label: "Live Classes" },
  { key: "study_material", label: "Study Materials" },
  { key: "attendance", label: "Attendance" },
  { key: "fee", label: "Fees" },
  { key: "result", label: "Results" },
  { key: "syllabus", label: "Syllabus" }
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
  syllabus: <BookMarked size={16} />,
  general: <Bell size={16} />
};

const PRIORITY_BORDER: Record<NotificationItem['priority'], string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-4 border-l-blue-500',
  low: 'border-l-4 border-l-slate-400',
};

const PRIORITY_BADGE: Record<NotificationItem['priority'], string> = {
  urgent: 'bg-red-100 text-red-500 dark:bg-red-500/15',
  high: 'bg-orange-100 text-orange-500 dark:bg-orange-500/15',
  medium: 'bg-blue-100 text-blue-500 dark:bg-blue-500/15',
  low: 'bg-slate-100 text-slate-500 dark:bg-slate-400/15',
};

export default function NotificationCenterContent({
  currentUser
}: NotificationCenterContentProps) {
  const { fetchUnreadCount: updateGlobalBadge } = useSchoolNotification();
  const navigate = useNavigate();
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
    fetchNotifications(1, true);
    fetchUnreadCount();
    setSelectedIds([]);
  }, [activeTab, debouncedSearch]);

  // Real-Time Socket Connection inside component
  useEffect(() => {
    if (!currentUser?.id) return;

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
          isFlag: newNotif.isFlag || false,
          createdAt: newNotif.createdAt || newNotif.created_at || new Date().toISOString(),
          actionUrl: newNotif.actionUrl
        };
        // Check filtering
        const matchesCategory = activeTab === "all" || activeTab === "unread" || activeTab === item.category || (activeTab === "flag" && item.isFlag);
        const matchesSearch = !debouncedSearch || 
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          item.message.toLowerCase().includes(debouncedSearch.toLowerCase());

        if (matchesCategory && matchesSearch) {
          return [item, ...prev];
        }
        return prev;
      });
      setTotalUnread(prev => prev + 1);
      updateGlobalBadge();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.id, activeTab, debouncedSearch]);

  // Intersection Observer for infinite scroll on native page
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage);
      }
    }, { rootMargin: '100px' });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchNotifications]);

  // Actions
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setTotalUnread(prev => Math.max(0, prev - 1));
        updateGlobalBadge();
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
        updateGlobalBadge();
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
        updateGlobalBadge();
        toast.success("All marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  // Bulk Actions
  const toggleSelect = (id: string) => {
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
        updateGlobalBadge();
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
        updateGlobalBadge();
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
    const msg = (n.message || '').toLowerCase();
    const text = `${cat} ${title} ${msg}`;

    const isChat = text.includes("chat") || text.includes("message") || text.includes("communication") || text.includes("conversation") || text.includes("reply") || text.includes("broadcast") || text.includes("notice");

    if (isTeacher) {
      if (isChat) return "/school/teacher/chat";
      if (cat.includes("calendar") || cat.includes("event") || title.includes("calendar") || title.includes("event")) return "/school/teacher/calendar";
      if (cat.includes("meeting") || title.includes("meeting")) return "/school/teacher/meetings";
      if (cat.includes("assignment") || title.includes("assignment")) return "/school/teacher/assignments";
      if (cat.includes("assessment") || title.includes("assessment")) return "/school/teacher/assessments";
      if (cat.includes("class") || title.includes("class")) return "/school/teacher/classes";
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/teacher/attendance";
      return "/school/teacher";
    }

    if (isStudent) {
      if (isChat) return "/school/student/chat";
      if (cat.includes("calendar") || cat.includes("event") || title.includes("calendar") || title.includes("event")) return "/school/student/calendar";
      if (cat.includes("assignment") || title.includes("assignment")) return "/school/student/assignments";
      if (cat.includes("assessment") || title.includes("assessment")) return "/school/student/assessments";
      if (cat.includes("class") || title.includes("class")) return "/school/student/live-classes";
      if (cat.includes("material") || title.includes("material")) return "/school/student/study-materials";
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/student/attendance";
      return "/school/student";
    }

    if (isParent) {
      if (isChat) return "/school/parent/communication";
      if (cat.includes("attendance") || title.includes("attendance")) return "/school/parent/child";
      return "/school/parent/dashboard";
    }

    // Default Admin routes
    if (isChat) return "/school/admin/communications";
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
      navigate(targetUrl);
    }
  };

  const PREF_ROWS: { key: keyof typeof preferences; label: string }[][] = [
    [
      { key: 'enableInApp', label: 'In-App Notifications' },
      { key: 'enableEmail', label: 'Email Alerts' },
      { key: 'enablePush', label: 'Push Notifications' },
    ],
    [
      { key: 'assignmentAlerts', label: 'Assignment Toggles' },
      { key: 'assessmentAlerts', label: 'Assessment & Exam Updates' },
      { key: 'attendanceAlerts', label: 'Attendance Disruption Alerts' },
      { key: 'announcementAlerts', label: 'General Announcements' },
      { key: 'liveClassAlerts', label: 'Live Classes Timetables' },
      { key: 'feeAlerts', label: 'Fee Due Dates & Receipts' },
    ],
  ];

  return (
    <div className="w-full flex flex-col relative">
      {/* Header */}
      <div className="pb-6 max-md:px-4 max-md:pt-3 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight m-0">Notifications Center</h2>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide block mt-1">{totalUnread} Unread Alerts</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowPreferences(!showPreferences);
              if (!showPreferences) loadPreferences();
            }}
            className={cn(
              "bg-transparent border-0 h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white",
              showPreferences && "!bg-indigo-100 !text-indigo-600 dark:!bg-indigo-500/20 dark:!text-indigo-400",
            )}
            title="Notification Preferences"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => fetchNotifications(1, true)}
            className="bg-transparent border-0 h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {showPreferences ? (
        /* Preferences Panel */
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
          <div className="flex items-center gap-2 pt-6 px-8 pb-2 max-md:px-4 max-md:pt-6">
            <SlidersHorizontal size={18} className="text-indigo-600" />
            <h3 className="text-base font-bold m-0 text-slate-800 dark:text-slate-100">Preferences Settings</h3>
          </div>

          {prefsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2 text-slate-500 text-sm font-semibold">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <p>Loading your preferences...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-8 py-4 max-md:px-4 flex flex-col gap-6">
              {PREF_ROWS.map((section, i) => (
                <div key={i} className="flex flex-col gap-3">
                  {i === 0 && (
                    <h4 className="text-[0.813rem] font-bold text-slate-500 uppercase tracking-wide m-0 mb-1">Delivery Channels</h4>
                  )}
                  {i === 1 && (
                    <h4 className="text-[0.813rem] font-bold text-slate-500 uppercase tracking-wide m-0 mb-1">Alert Categories</h4>
                  )}
                  {section.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between cursor-pointer w-full border-b border-slate-100 dark:border-slate-900 pb-3"
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                      <Switch
                        checked={preferences[key]}
                        onCheckedChange={(checked) => savePreferences({ ...preferences, [key]: checked })}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="p-6 px-8 max-md:px-4 border-t border-slate-100 dark:border-slate-900 shrink-0">
            <Button
              onClick={() => setShowPreferences(false)}
              variant="secondary"
              className="w-full h-auto py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-100 font-bold text-sm"
            >
              Back to Notifications
            </Button>
          </div>
        </div>
      ) : (
        /* Main Notifications Panel */
        <>
          {/* Filter bar & Search */}
          <div className="pt-6 pb-4 max-md:px-4 flex flex-col gap-5">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full h-auto rounded-2xl pl-11 pr-4 py-3 text-sm font-medium"
              />
            </div>

            <div className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap pb-2">
              <ToggleGroup
                type="single"
                value={activeTab}
                onValueChange={(v) => { if (v) setActiveTab(v); }}
                className="justify-start gap-2 w-max"
              >
                {CATEGORIES.map(cat => (
                  <ToggleGroupItem
                    key={cat.key}
                    value={cat.key}
                    className="h-auto px-4 py-2 rounded-xl text-[0.813rem] font-semibold text-slate-500 bg-transparent data-[state=on]:bg-indigo-600 data-[state=on]:text-white data-[state=on]:shadow-[0_4px_10px_rgba(79,70,229,0.25)] hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    {cat.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Bulk Toolbar */}
          <div className="py-2 pb-4 max-md:px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <div className="flex items-center">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 bg-transparent border-0 text-slate-500 text-[0.813rem] font-semibold cursor-pointer px-2 py-1 rounded-lg transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <CheckCheck size={14} />
                {selectedIds.length === notifications.length ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.length > 0 && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400 px-2 py-0.5 rounded-md ml-3">{selectedIds.length} Selected</span>
              )}
            </div>

            <div className="flex gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <button onClick={handleBulkMarkRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all duration-150 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-800/20 dark:text-emerald-400">
                    <CheckCircle size={14} />
                    Mark Read
                  </button>
                  <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all duration-150 bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-800/20 dark:text-red-400">
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </>
              ) : (
                totalUnread > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all duration-150 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-800/20 dark:text-violet-400">
                    <CheckCircle size={14} />
                    Mark All Read
                  </button>
                )
              )}
            </div>
          </div>

          {/* List */}
          <div className="py-6 max-md:px-4 max-md:py-4" ref={scrollContainerRef}>
            {loading && page === 1 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-2 text-slate-500 text-sm font-semibold">
                <Loader2 size={36} className="animate-spin text-indigo-600" />
                <p>Syncing alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500 text-center">
                <Bell size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 m-0 mb-1">No Notifications Yet</h4>
                <p className="text-[0.813rem] m-0">You are all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-8">
                {notifications.map(notif => {
                  const isSelected = selectedIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleOpenNotification(notif)}
                      className={cn(
                        "flex items-center max-md:items-start gap-4 max-md:gap-3 p-4 max-md:p-3 rounded-[1.25rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer relative transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:border-slate-300 dark:hover:border-slate-600",
                        PRIORITY_BORDER[notif.priority],
                        !notif.isRead && "bg-slate-50 dark:bg-slate-800/50",
                        isSelected && "!border-indigo-500 bg-indigo-500/[0.02] dark:bg-indigo-500/5",
                      )}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleSelect(notif.id)}
                        className="shrink-0 rounded-sm data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />

                      {/* Category Icon */}
                      <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        {categoryIcons[notif.category] || categoryIcons.general}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight">{notif.title}</h4>
                          {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[0.813rem] text-slate-500 dark:text-slate-400 mt-1 mb-1.5 leading-[1.4] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                          {notif.message}
                        </p>
                        <span className="text-[0.688rem] font-semibold text-slate-400 uppercase">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>

                      {/* Priority & Operations */}
                      <div className="flex items-center max-md:flex-col max-md:items-end max-md:justify-between max-md:self-stretch gap-3 max-md:gap-2 shrink-0">
                        <span className={cn("text-[0.625rem] max-md:text-[0.55rem] font-extrabold px-2 max-md:px-1.5 py-0.5 max-md:py-[0.1rem] rounded-full uppercase tracking-wide", PRIORITY_BADGE[notif.priority])}>
                          {notif.priority}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleOpenNotification(notif)}>
                              Open Link
                            </DropdownMenuItem>
                            {!notif.isRead && (
                              <DropdownMenuItem onClick={() => handleMarkAsRead(notif.id)}>
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(notif.id)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10"
                            >
                              Delete Alert
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 p-4 text-slate-500 text-xs font-semibold">
                    <Loader2 size={20} className="animate-spin text-indigo-600" />
                    <span>Loading more alerts...</span>
                  </div>
                )}
                {/* Invisible div for IntersectionObserver to trigger infinite scroll */}
                <div ref={loadMoreRef} style={{ height: '1px' }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
