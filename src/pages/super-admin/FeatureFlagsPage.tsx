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
    <div className={`min-w-[280px] rounded-lg border transition-all h-full ${isMasterEnabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className={`rounded-md p-1.5 shrink-0 ${isMasterEnabled ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <p className={`text-sm font-bold truncate shrink-0 max-w-[140px] ${isMasterEnabled ? "text-slate-900" : "text-slate-500"}`}>{master.label}</p>
              <p className="text-xs text-slate-500 truncate hidden sm:block">&mdash; {master.description}</p>
            </div>
          </div>
          <div className="shrink-0">
            <Toggle enabled={isMasterEnabled} onChange={(v) => onChange(master.key, v)} disabled={disabled} />
          </div>
        </div>
      </div>

      {subToggles.length > 0 && (
        <div className={`border-t border-slate-100 px-2 py-1.5 space-y-1 ${isMasterEnabled ? 'bg-slate-50/50' : 'bg-transparent opacity-60'}`}>
          {subToggles.map(sub => {
            const subEnabled = isMasterEnabled && (moduleState[sub.key] ?? sub.defaultEnabled);
            return (
              <div key={sub.key} className="flex items-center justify-between h-8 px-2 hover:bg-slate-100/50 rounded-md transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shrink-0 ${isMasterEnabled ? 'bg-slate-200 text-slate-600' : 'bg-slate-200/50 text-slate-400'}`}>
                    {sub.roleBadge}
                  </span>
                  <p className={`text-xs font-semibold truncate ${subEnabled ? "text-slate-700" : "text-slate-400"}`}>{sub.label}</p>
                </div>
                <div className="shrink-0">
                  <Toggle enabled={subEnabled} onChange={(v) => onChange(sub.key, v)} disabled={disabled || !isMasterEnabled} />
                </div>
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
    <div className={`min-w-[280px] rounded-lg border transition-all h-full ${isEnabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className={`rounded-md p-1.5 shrink-0 ${isEnabled ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-400"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <p className={`text-sm font-bold truncate shrink-0 max-w-[140px] ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>{feature.label}</p>
              <p className="text-xs text-slate-500 truncate hidden sm:block">&mdash; {feature.description}</p>
            </div>
          </div>
          <div className="shrink-0">
            <Toggle enabled={isEnabled} onChange={onChange} disabled={disabled || !masterEnabled} />
          </div>
        </div>
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

  const save = useCallback(async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await api.put(`/institutes/${school.id}`, patch);
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
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-slate-50 border-b border-slate-200">
        <span className="text-[18px] font-bold text-slate-900 flex-1">{school.name}</span>
        
        {/* AI enabled pill toggle */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
           <span className="text-[14px] font-medium text-slate-700">Global AI</span>
           {saving ? (
             <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
           ) : (
             <Toggle enabled={aiEnabled} onChange={toggleAiEnabled} />
           )}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-[14px] font-semibold hover:bg-blue-100 transition-colors"
        >
          {expanded ? "Hide Configuration" : "Configure"}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded per-school config */}
      {expanded && (
        <div className="p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 xl:gap-8 items-start">
            
            {/* Standard Features Column */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                Standard Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* AI Features Column */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                AI Features
                {!aiEnabled && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">Disabled globally</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
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
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-10 md:px-12 w-full font-sans text-slate-900 pb-24">
      <div className="mx-auto max-w-[1600px] space-y-10">
        
        <header className="pb-2">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Feature Flags</h1>
          <p className="mt-2 font-medium text-slate-500 text-[15px]">
            Control platform modules and AI features globally or per school.
          </p>
        </header>

        {/* ── Global Defaults ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Global Defaults</h2>
            <p className="text-[14px] text-slate-500">
              Default settings for newly created schools. 
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 xl:gap-8 items-start">
            
            {/* Standard Features Column */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                Standard Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MASTER_MODULE_FEATURES.map(f => (
                  <FeatureGroupCard
                    key={f.key}
                    master={f}
                    moduleState={moduleDefaults}
                    onChange={(key, val) => setModuleDefaults(p => ({ ...p, [key]: val }))}
                  />
                ))}
              </div>
            </div>

            {/* AI Features Column */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                AI Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
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

          </div>
        </section>

        {/* ── Per-school config ───────────────────────────────────────────── */}
        <section className="pt-4">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">School Overrides</h2>
            <p className="text-[14px] text-slate-500">
              Click <b>Configure</b> on any school to toggle overrides and AI features.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : schools.length === 0 ? (
            <p className="py-8 text-[14px] text-slate-500">No schools found.</p>
          ) : (
            <div className="space-y-6">
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
