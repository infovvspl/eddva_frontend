import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, BellOff, LogOut, Settings, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ThemeSwitch } from "@/components/layout/ThemeSwitch"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications"
import { useLogout } from "@/hooks/use-auth"
import { getCoachingNotificationLink } from "@/lib/api/notifications"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

const NOTIFICATIONS_PATH = "/super-admin/announcements"
const SETTINGS_PATH = "/super-admin/settings"

/** Closes `onClose` when a mousedown lands outside `ref` while `open`. */
function useOutsideClose(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  const handler = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    },
    [ref, onClose],
  )
  useEffect(() => {
    if (!open) return
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [open, handler])
}

/**
 * Notification bell + profile menu for the coaching super admin header.
 * Same behaviour as the header in DashboardLayout.
 */
export function CoachingHeaderActions() {
  const user = useAuthStore((s) => s.user)
  const modulesPermissions = useAuthStore((s) => s.modulesPermissions)
  const logout = useLogout()
  const navigate = useNavigate()

  const { data: unreadNotifCount = 0 } = useUnreadCount()
  const { data: notifResult } = useNotifications({ limit: 15 })
  const notifs = Array.isArray(notifResult) ? notifResult : (notifResult?.data ?? [])
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const [showNotif, setShowNotif] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useOutsideClose(notifRef, showNotif, () => setShowNotif(false))
  useOutsideClose(userMenuRef, showUserMenu, () => setShowUserMenu(false))

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <ThemeSwitch />
      {modulesPermissions?.notifications !== false && (
        <div className="relative" ref={notifRef}>
          <button
            data-tour="notifications"
            onClick={() => setShowNotif((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 shadow-xs transition-colors hover:border-indigo-200 hover:text-indigo-600"
            title={
              unreadNotifCount > 0
                ? `${unreadNotifCount} unread notifications`
                : "Notifications"
            }
          >
            <Bell className="h-5 w-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="fixed left-5 right-5 top-16 z-[80] w-auto overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Notifications
                    {unreadNotifCount > 0 && (
                      <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                        {unreadNotifCount}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={() => markAllRead.mutate()}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotif(false)} aria-label="Close">
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto bg-white dark:bg-slate-900">
                  {notifs.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-slate-400">
                      <BellOff className="mb-2 h-8 w-8 opacity-30" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifs.slice(0, 3).map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.readAt && !n.isRead) markRead.mutate(n.id)
                          setShowNotif(false)
                          const link = getCoachingNotificationLink(n, user.role)
                          if (link) navigate(link)
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
                          !n.readAt && "bg-indigo-50/50 dark:bg-indigo-950/30",
                        )}
                      >
                        <div className="flex gap-2">
                          <div
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              !n.readAt ? "bg-indigo-600" : "bg-transparent",
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-center">
                  <button
                    onClick={() => {
                      setShowNotif(false)
                      navigate(NOTIFICATIONS_PATH)
                    }}
                    className="flex w-full items-center justify-center gap-1 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    <span>Show all notifications</span>
                    {notifs.length > 3 && (
                      <span className="font-normal text-indigo-500">
                        ({notifs.length - 3} more)
                      </span>
                    )}
                    <span>→</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu((v) => !v)}
          aria-haspopup="true"
          aria-expanded={showUserMenu}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm transition-colors hover:border-indigo-300"
        >
          <ProfileAvatar
            src={user.profileImage || (user as any).profilePictureUrl || null}
            name={user.name}
            className="h-full w-full"
            fallbackClassName="text-[10px] font-bold text-indigo-600"
          />
        </button>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              role="menu"
              aria-label="User menu"
              className="absolute right-0 top-12 z-[80] mt-2 w-52 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="mt-0.5 text-[10px] capitalize text-slate-400">
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setShowUserMenu(false)
                  navigate(SETTINGS_PATH)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
