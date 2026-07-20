import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Compass, Video, MessageSquare, Loader2, ChevronDown, ChevronUp, Search, Filter,
  Zap, Presentation, Languages, FileSearch, GraduationCap, Users, Settings, Shield, User
} from "lucide-react";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";
import { MASTER_MODULE_FEATURES, ROLE_MODULE_FEATURES, isModuleEnabled, DEFAULT_MODULES } from "@/lib/constants/moduleFeatures";
import api from "@/lib/api/school-client";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from "@/components/school/admin/Skeleton";

// ── Icon map ────────────────────────────────────────────────────────────────

const IconMap: Record<string, React.FC<any>> = {
  MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Compass, Video, MessageSquare, Sparkles,
  Zap, Presentation, Languages, FileSearch, GraduationCap, Users, Settings, Shield, User
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
    <div className={`w-full min-w-0 sm:min-w-[280px] rounded-lg border transition-all h-full ${isMasterEnabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
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
              <div key={sub.key} className="flex items-center justify-between h-auto py-1 px-2 hover:bg-slate-100/50 rounded-md transition-colors">
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

const AiFeaturesAccordion = ({
  globalEnabled,
  onGlobalToggle,
  features,
  onFeatureToggle,
  disabled = false,
  saving = false
}: {
  globalEnabled: boolean;
  onGlobalToggle: (val: boolean) => void;
  features: Record<string, boolean>;
  onFeatureToggle: (key: string, val: boolean) => void;
  disabled?: boolean;
  saving?: boolean;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    student: true,
    teacher: true,
    shared_teacher_student: true,
    shared_teacher_admin: true,
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const getFeaturesByCategory = (catId: string) => {
    return AI_FEATURES.filter(f => f.category === catId);
  };

  const CATEGORIES = [
    { id: "student", label: "Student Features", icon: GraduationCap },
    { id: "teacher", label: "Teacher Features", icon: Users },
    { id: "shared_teacher_student", label: "Shared Teacher / Student", icon: Users },
    { id: "shared_teacher_admin", label: "Shared Teacher / Admin", icon: Settings },
    { id: "school_admin", label: "School Admin", icon: Shield },
    { id: "parent", label: "Parent", icon: User },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Master Toggle */}
      <div className="flex items-center justify-between bg-purple-50/50 border border-purple-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-purple-100 text-purple-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Global AI Activation</h4>
            <p className="text-xs text-slate-500">Enable or disable all AI features for this scope</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
          <Toggle
            enabled={globalEnabled}
            onChange={onGlobalToggle}
            disabled={disabled || saving}
          />
        </div>
      </div>

      {/* Accordion Container */}
      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const catFeatures = getFeaturesByCategory(cat.id);
          const isExpanded = !!expandedCategories[cat.id];
          const Icon = cat.icon;

          return (
            <div key={cat.id} className={`border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-opacity duration-200 ${!globalEnabled ? "opacity-60" : ""}`}>
              {/* Category Header */}
              <button
                type="button"
                onClick={() => globalEnabled && toggleCategory(cat.id)}
                disabled={!globalEnabled}
                className={`w-full flex items-center justify-between p-4 bg-slate-50 transition-colors text-left focus:outline-none ${globalEnabled ? "hover:bg-slate-100/50 cursor-pointer" : "cursor-not-allowed"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-1.5 bg-slate-200/60 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">{cat.label}</span>
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      ({catFeatures.length} {catFeatures.length === 1 ? 'feature' : 'features'})
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              {/* Category Features List */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white">
                  {catFeatures.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No AI features in this category
                    </div>
                  ) : (
                    catFeatures.map(f => {
                      const FeatureIcon = IconMap[f.icon || 'Sparkles'] || Sparkles;
                      const isFeatureEnabled = globalEnabled && (features[f.key] ?? f.defaultEnabled);

                      return (
                        <div key={f.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 transition-colors">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`rounded-lg p-2 shrink-0 mt-0.5 border ${
                              isFeatureEnabled ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}>
                              <FeatureIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-bold truncate ${
                                  isFeatureEnabled ? "text-slate-900" : "text-slate-500"
                                }`}>
                                  {f.label}
                                </span>
                                
                                {/* UI Type Badges */}
                                {f.uiType === 'mixed' ? (
                                  <>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/30">
                                      Student: Full Page
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/30">
                                      Teacher: Embedded
                                    </span>
                                  </>
                                ) : f.uiType === 'full_page' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/30">
                                    Full Page
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/30">
                                    Embedded
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                                {f.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            {/* Status Indicator */}
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isFeatureEnabled 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}>
                              {isFeatureEnabled ? "Enabled" : "Disabled"}
                            </span>

                            {/* Toggle Switch */}
                            <Toggle
                              enabled={isFeatureEnabled}
                              onChange={(val) => onFeatureToggle(f.key, val)}
                              disabled={disabled || !globalEnabled || saving}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
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

  // Local state for AI toggles (UI-only for this session)
  const [localAiEnabled, setLocalAiEnabled] = useState<boolean>(() => school.ai_enabled ?? school.aiEnabled ?? false);
  const [localAiFeatures, setLocalAiFeatures] = useState<Record<string, boolean>>(() => normalizeAi(school.ai_features ?? school.aiFeatures));

  // Sync state with school prop changes
  useEffect(() => {
    setLocalAiEnabled(school.ai_enabled ?? school.aiEnabled ?? false);
    setLocalAiFeatures(normalizeAi(school.ai_features ?? school.aiFeatures));
  }, [school.id, school.ai_enabled, school.aiEnabled, school.ai_features, school.aiFeatures]);

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

  const toggleLocalAiEnabled = async (val: boolean) => {
    const prev = localAiEnabled;
    setLocalAiEnabled(val);
    setSaving(true);
    try {
      const res = await api.put(`/institutes/${school.id}`, { aiEnabled: val });
      const updated = res.data?.data ?? res.data;
      onSaved(school.id, updated);
      toast.success(`${school.name} global AI settings updated`);
    } catch {
      setLocalAiEnabled(prev);
      toast.error("Failed to save global AI changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleLocalAiFeature = async (key: string, val: boolean) => {
    const prev = localAiFeatures[key];
    setLocalAiFeatures(prevMap => ({ ...prevMap, [key]: val }));
    setSaving(true);
    try {
      const updatedFeatures = { ...localAiFeatures, [key]: val };
      const res = await api.put(`/institutes/${school.id}`, { aiFeatures: updatedFeatures });
      const updated = res.data?.data ?? res.data;
      onSaved(school.id, updated);
      const feat = AI_FEATURES.find(f => f.key === key);
      toast.success(`${school.name}: ${feat?.label || key} updated`);
    } catch {
      setLocalAiFeatures(prevMap => ({ ...prevMap, [key]: prev }));
      toast.error("Failed to save AI feature changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (key: string, val: boolean) => save({ modulesPermissions: { ...modules, [key]: val } });

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        <span className="text-base sm:text-[18px] font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none flex-1">{school.name}</span>
        
        <div className="flex items-center gap-3">
          {/* AI enabled pill toggle */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-slate-200 shadow-sm text-xs sm:text-[14px]">
             <span className="font-medium text-slate-700">Global AI</span>
             {saving ? (
               <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
             ) : (
               <Toggle enabled={localAiEnabled} onChange={toggleLocalAiEnabled} />
             )}
          </div>

          <button
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs sm:text-[14px] font-semibold hover:bg-blue-100 transition-colors"
          >
            <span className="hidden sm:inline">{expanded ? "Hide Configuration" : "Configure"}</span>
            <span className="sm:hidden">{expanded ? "Hide" : "Configure"}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded per-school config */}
      {expanded && (
        <div className="p-4 sm:p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 xl:gap-8 items-start">
            
            {/* Standard Features Column */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
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
            <div className="w-full">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                AI Features
                {!localAiEnabled && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Disabled globally</span>}
              </h3>
              <AiFeaturesAccordion
                globalEnabled={localAiEnabled}
                onGlobalToggle={toggleLocalAiEnabled}
                features={localAiFeatures}
                onFeatureToggle={toggleLocalAiFeature}
                disabled={saving}
                saving={saving}
              />
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

  // Keep AI defaults state purely in memory as requested
  const [aiDefaults, setAiDefaults] = useState<Record<string, boolean>>(() => {
    return AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {});
  });
  const [globalAiDefault, setGlobalAiDefault] = useState<boolean>(true);

  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [aiFilter, setAiFilter] = useState("ALL");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => { localStorage.setItem("module_feature_defaults", JSON.stringify(moduleDefaults)); }, [moduleDefaults]);

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

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const nameMatches = !searchQuery.trim() || school.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatches = statusFilter === "ALL" || school.status === statusFilter;
      const aiEnabled = school.ai_enabled ?? school.aiEnabled ?? false;
      const aiMatches = aiFilter === "ALL" || (aiFilter === "ENABLED" && aiEnabled) || (aiFilter === "DISABLED" && !aiEnabled);
      return nameMatches && statusMatches && aiMatches;
    });
  }, [schools, searchQuery, statusFilter, aiFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setAiFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-8 py-6 sm:py-10 md:px-12 w-full text-slate-900 pb-24">
      <div className="mx-auto max-w-[1600px] space-y-8 sm:space-y-10">
        
        <header className="pb-2">
          <h1 className="text-2xl sm:text-[32px] font-bold text-slate-900 tracking-tight">Feature Flags</h1>
          <p className="mt-1.5 font-medium text-slate-500 text-xs sm:text-[15px]">
            Control platform modules and AI features globally or per school.
          </p>
        </header>

        {/* ── Global Defaults ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">Global Defaults</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Default settings for newly created schools. 
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 xl:gap-8 items-start">
            
            {/* Standard Features Column */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
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
            <div className="w-full">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                AI Features
              </h3>
              <AiFeaturesAccordion
                globalEnabled={globalAiDefault}
                onGlobalToggle={(val) => setGlobalAiDefault(val)}
                features={aiDefaults}
                onFeatureToggle={(key, val) => setAiDefaults(p => ({ ...p, [key]: val }))}
              />
            </div>

          </div>
        </section>

        {/* ── Per-school config ───────────────────────────────────────────── */}
        <section className="pt-4">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">School Overrides</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Click <b>Configure</b> on any school to toggle overrides and AI features.
            </p>
          </div>

          {/* ── Mobile Filters ── */}
          <div className="flex flex-col md:hidden gap-3 mb-6 bg-slate-100/60 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <Search className="h-3.5 w-3.5 text-blue-600" />
                <span>{filteredSchools.length} schools</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                  showMobileFilters
                    ? "bg-blue-600 border-blue-700 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </button>
            </div>
            
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schools…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            {showMobileFilters && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "PENDING", label: "Pending" },
                    { value: "SUSPENDED", label: "Suspended" },
                  ]}
                  className="w-full"
                />

                <CustomSelect
                  value={aiFilter}
                  onChange={setAiFilter}
                  options={[
                    { value: "ALL", label: "All AI States" },
                    { value: "ENABLED", label: "AI Enabled" },
                    { value: "DISABLED", label: "AI Disabled" },
                  ]}
                  className="w-full"
                />

                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── Desktop Filters ── */}
          <div className="hidden md:flex flex-wrap items-center gap-3 mb-6 bg-slate-100/60 p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schools…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "PENDING", label: "Pending" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
              className="w-48"
            />

            <CustomSelect
              value={aiFilter}
              onChange={setAiFilter}
              options={[
                { value: "ALL", label: "All AI States" },
                { value: "ENABLED", label: "AI Enabled" },
                { value: "DISABLED", label: "AI Disabled" },
              ]}
              className="w-48"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-750 hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>

            <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{filteredSchools.length} matches</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <p className="py-8 text-[14px] text-slate-500 text-center font-medium bg-white rounded-2xl border border-slate-200 shadow-sm">No schools match your filters.</p>
          ) : (
            <div className="space-y-6">
              {filteredSchools.map(school => (
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
