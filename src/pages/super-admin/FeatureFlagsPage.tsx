import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Compass, Video, MessageSquare, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";
import { MASTER_MODULE_FEATURES, ROLE_MODULE_FEATURES, isModuleEnabled, DEFAULT_MODULES } from "@/lib/constants/moduleFeatures";
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

// ── Feature Cards ──────────────────────────────────────────────────────────────

const FeatureGroupCard = ({
  master, moduleState, onChange, disabled,
}: {
  master: any; moduleState: Record<string, boolean>; onChange: (key: string, v: boolean) => void; disabled?: boolean;
}) => {
  const Icon = IconMap[master.icon] || Sparkles;
  const isMasterEnabled = moduleState[master.key] ?? master.defaultEnabled;

  const subToggles = ROLE_MODULE_FEATURES.flatMap(group => 
    group.features
      .filter(f => f.parentKey === master.key)
      .map(f => ({ ...f, roleBadge: group.roleLabel.replace(' Features', '').replace('School Admin', 'Admin') }))
  );

  return (
    <div className={`rounded-xl border transition-all ${isMasterEnabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-2.5 ${isMasterEnabled ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isMasterEnabled ? "text-slate-900" : "text-slate-500"}`}>{master.label}</p>
            <p className="text-xs text-slate-500">{master.description}</p>
          </div>
        </div>
        <Toggle enabled={isMasterEnabled} onChange={(v) => onChange(master.key, v)} disabled={disabled} />
      </div>

      {subToggles.length > 0 && (
        <div className={`border-t p-3 space-y-1 ${isMasterEnabled ? 'border-slate-100 bg-slate-50/50' : 'border-transparent bg-transparent opacity-60'}`}>
          {subToggles.map(sub => {
            const subEnabled = isMasterEnabled && (moduleState[sub.key] ?? sub.defaultEnabled);
            return (
              <div key={sub.key} className="flex items-center justify-between py-2 pl-4 pr-1 hover:bg-slate-100/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${isMasterEnabled ? 'bg-slate-200 text-slate-600' : 'bg-slate-200/50 text-slate-400'}`}>
                    {sub.roleBadge}
                  </span>
                  <div>
                    <p className={`text-[13px] font-semibold ${subEnabled ? "text-slate-700" : "text-slate-400"}`}>{sub.label}</p>
                  </div>
                </div>
                <Toggle enabled={subEnabled} onChange={(v) => onChange(sub.key, v)} disabled={disabled || !isMasterEnabled} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AiFeatureCard = ({
  feature, enabled, onChange, disabled, masterEnabled
}: {
  feature: any; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean; masterEnabled: boolean;
}) => {
  const Icon = IconMap[feature.icon] || Sparkles;
  const isEnabled = masterEnabled && enabled;

  return (
    <div className={`rounded-xl border transition-all ${isEnabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-2.5 ${isEnabled ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-400"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>{feature.label}</p>
            <p className="text-xs text-slate-500">{feature.description}</p>
          </div>
        </div>
        <Toggle enabled={isEnabled} onChange={onChange} disabled={disabled || !masterEnabled} />
      </div>
    </div>
  );
};

// ── Normalise helpers ────────────────────────────────────────────────────────

function normalizeAi(raw: any): Record<string, boolean> {
  const defaults = AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {} as Record<string, boolean>);
  let parsed = raw;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return defaults; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
  return { ...defaults, ...parsed };
}

function normalizeModules(raw: any): Record<string, boolean> {
  let parsed = raw;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return DEFAULT_MODULES; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_MODULES;
  return { ...DEFAULT_MODULES, ...parsed };
}

// ── Expandable school row ────────────────────────────────────────────────────

const SchoolRow = ({ school, onSaved }: { school: any; onSaved: (id: string, patch: any) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const aiEnabled: boolean = school.ai_enabled ?? school.aiEnabled ?? false;
  const aiFeatures = normalizeAi(school.ai_features ?? school.aiFeatures);
  const modules = normalizeModules(school.modules_permissions ?? school.modulesPermissions);

  const activeModules = Object.values(modules).filter(Boolean).length;
  const activeAi = AI_FEATURES.filter(f => aiFeatures[f.key]).length;

  const save = useCallback(async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await api.put(`/institutes/${school.id}`, patch);
      // Use the API response (which is the fresh DB row from findOne) to update local state
      const updated = res.data?.data ?? res.data;
      onSaved(school.id, updated);
      toast.success(`${school.name} updated`);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [school.id, school.name, onSaved]);

  const toggleAiEnabled = (val: boolean) => save({ aiEnabled: val });
  const toggleAiFeature = (key: string, val: boolean) => save({ aiFeatures: { ...aiFeatures, [key]: val } });
  const toggleModule = (key: string, val: boolean) => save({ modulesPermissions: { ...modules, [key]: val } });

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
          {activeModules} active modules &middot; {activeAi}/{AI_FEATURES.length} AI
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
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Standard Features */}
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">Standard Features</p>
            {MASTER_MODULE_FEATURES.map(f => (
              <FeatureGroupCard
                key={f.key}
                master={f}
                moduleState={modules}
                onChange={(key, val) => toggleModule(key, val)}
                disabled={saving}
              />
            ))}
          </div>

          {/* AI Features */}
          <div className="space-y-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 flex items-center gap-2">
              AI Features
              {!aiEnabled && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">Disabled globally above</span>}
            </p>
            {AI_FEATURES.map(f => (
              <AiFeatureCard
                key={f.key}
                feature={f}
                enabled={aiFeatures[f.key] ?? true}
                onChange={(v) => toggleAiFeature(f.key, v)}
                disabled={saving || !aiEnabled}
                masterEnabled={aiEnabled}
              />
            ))}
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
      return s ? JSON.parse(s) : DEFAULT_MODULES;
    } catch { return DEFAULT_MODULES; }
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

  const handleSaved = useCallback((id: string, updated: any) => {
    setSchools(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
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

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">Standard Features</p>
              
              {MASTER_MODULE_FEATURES.map(f => (
                <FeatureGroupCard
                  key={f.key}
                  master={f}
                  moduleState={moduleDefaults}
                  onChange={(key, val) => setModuleDefaults(p => ({ ...p, [key]: val }))}
                />
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">AI Features</p>
              {AI_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={aiDefaults[f.key] ?? f.defaultEnabled}
                  onChange={v => setAiDefaults(p => ({ ...p, [f.key]: v }))}
                  masterEnabled={true}
                />
              ))}
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
