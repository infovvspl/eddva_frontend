import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Compass, Video, MessageSquare, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";
import { MODULE_FEATURES, isModuleEnabled } from "@/lib/constants/moduleFeatures";
import api from "@/lib/api/school-client";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

// ── Icon map ────────────────────────────────────────────────────────────────

const IconMap: Record<string, React.FC<any>> = {
  MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Compass, Video, MessageSquare, Sparkles,
};

// ── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({
  enabled, onChange, disabled,
}: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none
      ${enabled ? "bg-blue-600" : "bg-slate-200"}
      ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
      ${enabled ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

// ── Feature row ──────────────────────────────────────────────────────────────

const FeatureRow = ({
  iconKey, label, description, enabled, onChange, disabled,
}: {
  iconKey: string; label: string; description: string;
  enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) => {
  const Icon = IconMap[iconKey] || Sparkles;
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2 ${enabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={`text-sm font-semibold ${enabled ? "text-slate-900" : "text-slate-500"}`}>{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
};

// ── Normalise helpers ────────────────────────────────────────────────────────

function normalizeFeatures<T extends { key: string; defaultEnabled: boolean }>(
  features: T[],
  raw: Record<string, boolean> | null | undefined,
): Record<string, boolean> {
  const defaults = features.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {} as Record<string, boolean>);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  return { ...defaults, ...raw };
}

// ── Expandable school row ────────────────────────────────────────────────────

const SchoolRow = ({ school, onSaved }: { school: any; onSaved: (id: string, patch: any) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const aiEnabled: boolean = school.ai_enabled ?? school.aiEnabled ?? false;
  const aiFeatures = normalizeFeatures(AI_FEATURES, school.ai_features ?? school.aiFeatures);
  const modules = normalizeFeatures(MODULE_FEATURES, school.modules_permissions ?? school.modulesPermissions);

  const activeModules = MODULE_FEATURES.filter(f => isModuleEnabled(modules, f.key)).length;
  const activeAi = AI_FEATURES.filter(f => aiFeatures[f.key]).length;

  const save = useCallback(async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      await api.put(`/institutes/${school.id}`, patch);
      onSaved(school.id, patch);
      toast.success(`${school.name} updated`);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [school.id, school.name, onSaved]);

  const toggleAiEnabled = () => save({ aiEnabled: !aiEnabled });
  const toggleAiFeature = (key: string) => save({ aiFeatures: { ...aiFeatures, [key]: !aiFeatures[key] } });
  const toggleModule = (key: string) => save({ modulesPermissions: { ...modules, [key]: !modules[key] } });

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
        <span className="min-w-[180px] flex-1 font-medium text-slate-900">{school.name}</span>

        {/* AI enabled pill toggle */}
        <div className="flex items-center gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <Toggle enabled={aiEnabled} onChange={toggleAiEnabled} />
          )}
          <span className={`text-xs font-semibold ${aiEnabled ? "text-blue-600" : "text-slate-400"}`}>
            {aiEnabled ? "AI On" : "AI Off"}
          </span>
        </div>

        {/* Modules summary */}
        <span className="text-sm text-slate-500 font-medium">
          {activeModules}/{MODULE_FEATURES.length} modules &middot; {activeAi}/{AI_FEATURES.length} AI
        </span>

        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          {expanded ? "Collapse" : "Configure"}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded per-school config */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Platform Modules */}
          <div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Platform Modules</p>
            <div className="space-y-2">
              {MODULE_FEATURES.map(f => (
                <FeatureRow
                  key={f.key}
                  iconKey={f.icon}
                  label={f.label}
                  description={f.description}
                  enabled={isModuleEnabled(modules, f.key)}
                  onChange={() => toggleModule(f.key)}
                  disabled={saving}
                />
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
              AI Features {!aiEnabled && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">AI disabled — turn on above</span>}
            </p>
            <div className="space-y-2">
              {AI_FEATURES.map(f => (
                <FeatureRow
                  key={f.key}
                  iconKey={f.icon}
                  label={f.label}
                  description={f.description}
                  enabled={aiEnabled && (aiFeatures[f.key] ?? true)}
                  onChange={() => toggleAiFeature(f.key)}
                  disabled={saving || !aiEnabled}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const FeatureFlagsPage = () => {
  const [moduleDefaults, setModuleDefaults] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("module_feature_defaults");
      return s ? JSON.parse(s) : MODULE_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {});
    } catch { return MODULE_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {}); }
  });

  const [aiDefaults, setAiDefaults] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("ai_feature_defaults");
      return s ? JSON.parse(s) : AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {});
    } catch { return AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {}); }
  });

  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { localStorage.setItem("module_feature_defaults", JSON.stringify(moduleDefaults)); }, [moduleDefaults]);
  useEffect(() => { localStorage.setItem("ai_feature_defaults", JSON.stringify(aiDefaults)); }, [aiDefaults]);

  useEffect(() => { loadSchools(); }, []);

  async function loadSchools() {
    try {
      setLoading(true);
      const res = await api.get("/institutes", { params: { perPage: 1000 } });
      const data = res.data?.data;
      const rawList = Array.isArray(data) ? data : (data?.items || res.data?.items || []);
      setSchools(rawList);
    } catch {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  }

  const handleSaved = useCallback((id: string, patch: any) => {
    setSchools(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 pb-20">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold text-slate-900">Feature Flags</h1>
          <p className="mt-2 font-medium text-slate-500">
            Control platform modules and AI features per school.
          </p>
        </header>

        {/* ── Global Defaults ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Global Defaults</h2>
          <p className="mt-1 text-sm text-slate-500">Default settings for newly created schools.</p>
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            ℹ️ These apply to new schools only. Use the per-school section below to change existing schools.
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Platform Modules</p>
              <div className="space-y-2">
                {MODULE_FEATURES.map(f => (
                  <FeatureRow
                    key={f.key}
                    iconKey={f.icon}
                    label={f.label}
                    description={f.description}
                    enabled={moduleDefaults[f.key] ?? f.defaultEnabled}
                    onChange={v => setModuleDefaults(p => ({ ...p, [f.key]: v }))}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">AI Features</p>
              <div className="space-y-2">
                {AI_FEATURES.map(f => (
                  <FeatureRow
                    key={f.key}
                    iconKey={f.icon}
                    label={f.label}
                    description={f.description}
                    enabled={aiDefaults[f.key] ?? f.defaultEnabled}
                    onChange={v => setAiDefaults(p => ({ ...p, [f.key]: v }))}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Per-school config ───────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">Schools</h2>
            <p className="mt-1 text-sm text-slate-500">
              Click <b>Configure</b> on any school to toggle modules and AI features in real-time.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : schools.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No schools found.</p>
          ) : (
            <div>
              {schools.map(school => (
                <SchoolRow key={school.id} school={school} onSaved={handleSaved} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
