import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { useAuthStore, AiFeatureKey } from "@/lib/auth-store";

/**
 * Inline conditional — renders children ONLY if the tenant has the AI feature
 * enabled, otherwise renders nothing. Use to hide AI buttons/sections embedded
 * inside non-AI pages (e.g. "Generate with AI" in the mock test builder).
 */
export function IfAiFeature({
  feature,
  children,
  fallback = null,
}: {
  feature: AiFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { aiEnabled, aiFeatures } = useAuthStore();
  if (aiEnabled && aiFeatures.includes(feature)) return <>{children}</>;
  return <>{fallback}</>;
}

/**
 * Wraps an AI-powered page/section. If the current tenant does not have the
 * required AI feature enabled, renders an "upgrade" placeholder instead of
 * the children. Used for coaching tenants only — school pages never mount this.
 */
export function AiFeatureGate({
  feature,
  children,
  title = "AI Feature",
}: {
  feature: AiFeatureKey;
  children: ReactNode;
  title?: string;
}) {
  const { aiEnabled, aiFeatures } = useAuthStore();
  const hasAccess = aiEnabled && aiFeatures.includes(feature);

  if (hasAccess) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{title} is not enabled</h2>
        <p className="text-sm font-semibold text-slate-400 leading-relaxed mb-6">
          This AI feature is part of the AI-powered plan. Contact your institute administrator
          to unlock AI-driven learning tools.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-2">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Plan Required</span>
        </div>
      </div>
    </motion.div>
  );
}
