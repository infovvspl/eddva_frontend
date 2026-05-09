import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { XP_TOAST_EVENT, type XpToastPayload } from "@/lib/xp-toast";

type XpToastEvent = CustomEvent<XpToastPayload>;

export function XPToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<XpToastPayload | null>(null);

  const show = useCallback((xpEarned: number, isMockXp = false) => {
    if (xpEarned <= 0) return;
    setToast({ xpEarned, isMockXp });
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as XpToastEvent).detail;
      show(detail.xpEarned, detail.isMockXp);
    };
    window.addEventListener(XP_TOAST_EVENT, onToast);
    return () => window.removeEventListener(XP_TOAST_EVENT, onToast);
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[300] sm:right-6 sm:top-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={`${toast.xpEarned}-${toast.isMockXp ? "mock" : "leaderboard"}`}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-2xl",
                toast.isMockXp ? "border-violet-200" : "border-amber-200",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  toast.isMockXp ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700",
                )}
              >
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-lg font-black leading-none text-slate-900">+{toast.xpEarned} XP</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {toast.isMockXp ? "Mock test XP" : "Leaderboard XP"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
