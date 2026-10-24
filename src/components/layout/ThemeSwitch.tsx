import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

/** Light/dark toggle for the super admin headers. Dark mode is only active on super admin routes (see ThemeProvider). */
export function ThemeSwitch({
  className,
  variant = "bordered",
}: {
  className?: string
  /** "bordered" matches the coaching header icons; "ghost" matches the school navbar icons. */
  variant?: "bordered" | "ghost"
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex shrink-0 items-center justify-center transition-colors",
        variant === "bordered"
          ? "h-10 w-10 rounded-2xl border border-slate-100 bg-white text-slate-500 shadow-xs hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
          : "size-9 rounded-xl text-slate-500 hover:bg-slate-100/75 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        className,
      )}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}
