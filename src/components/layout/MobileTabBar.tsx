import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Menu } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { DEFAULT_NAV_COLOR, NAV_ICON_COLORS } from "@/components/layout/nav-colors"
import { cn } from "@/lib/utils"

export type TabItem = { label: string; path: string; icon: LucideIcon; end?: boolean }

const SHORT_LABELS: Record<string, string> = {
  Dashboard: "Home",
  Communication: "Comm",
  "Live Classes": "Live",
}

/**
 * Bottom tab bar for phones: a few primary tabs plus a "More" drawer with the
 * rest. Same look and behaviour as the bar in DashboardLayout.
 */
export function MobileTabBar({
  items,
  primaryPaths,
}: {
  items: TabItem[]
  /** Paths shown as tabs; everything else goes in "More". */
  primaryPaths: string[]
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = items.filter((i) => primaryPaths.includes(i.path))
  const more = items.filter((i) => !primaryPaths.includes(i.path))

  const isActive = (item: TabItem) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)

  const go = (path: string) => {
    navigate(path)
    setMoreOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-around border-t border-slate-100 bg-white/95 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md md:hidden">
        {primary.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const colors = NAV_ICON_COLORS[item.path] || DEFAULT_NAV_COLOR
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className="relative flex min-w-[64px] flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-1 transition-all"
            >
              <div
                className={cn(
                  "relative z-10 transition-colors duration-300",
                  active ? colors.active : colors.inactive,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "relative z-10 text-[9px] font-bold uppercase tracking-wider transition-colors duration-300",
                  active ? `${colors.active} font-black` : colors.inactive,
                )}
              >
                {SHORT_LABELS[item.label] ?? item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={cn("absolute inset-0 -z-10 rounded-2xl", colors.bg)}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}

        {more.length > 0 && (
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex min-w-[64px] flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-1 transition-all"
          >
            {(() => {
              const active = moreOpen || more.some(isActive)
              return (
                <>
                  <div
                    className={cn(
                      "relative z-10 transition-colors duration-300",
                      active ? "text-blue-600" : "text-slate-400",
                    )}
                  >
                    <Menu className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "relative z-10 text-[9px] font-bold uppercase tracking-wider transition-colors duration-300",
                      active ? "font-black text-blue-600" : "text-slate-400",
                    )}
                  >
                    More
                  </span>
                  {active && (
                    <div className="absolute inset-0 -z-10 rounded-2xl bg-blue-50" />
                  )}
                </>
              )
            })()}
          </button>
        )}
      </div>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-[100] bg-black/50 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              className="fixed bottom-0 left-0 right-0 z-[110] max-h-[80dvh] overflow-hidden rounded-t-[2.5rem] border-t border-slate-100 bg-white p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] shadow-2xl md:hidden"
            >
              <div
                onClick={() => setMoreOpen(false)}
                className="-mt-2 flex w-full shrink-0 cursor-pointer justify-center py-2"
              >
                <div className="h-1.5 w-12 rounded-full bg-slate-200 transition-colors hover:bg-slate-300" />
              </div>
              <h3 className="mb-5 px-2 text-base font-bold text-slate-800">More Options</h3>
              <div className="grid grid-cols-3 gap-x-3 gap-y-6 overflow-y-auto pr-1">
                {more.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item)
                  const colors = NAV_ICON_COLORS[item.path] || DEFAULT_NAV_COLOR
                  return (
                    <button
                      key={item.path}
                      onClick={() => go(item.path)}
                      className="flex flex-col items-center gap-2 rounded-2xl p-2 transition-all active:scale-95"
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300",
                          active
                            ? `${colors.bg} border-current/20 ${colors.active} scale-105 shadow-sm`
                            : `${colors.bg} border-transparent ${colors.inactive} hover:scale-105`,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          "w-full truncate text-center text-[10px] font-bold tracking-tight transition-colors duration-300",
                          active ? `${colors.active} font-extrabold` : "text-slate-600",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
