import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Video, MessageSquare, Loader2, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { COACHING_AI_FEATURES } from "@/lib/constants/coachingAiFeatures";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

// ── Icon map ─────────────────────────────────────────────────────────────────

const IconMap: Record<string, React.FC<any>> = {
  MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Video, MessageSquare, Sparkles,
};

// ── Toggle ────────────────────────────────────────────────────────────────────

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

// ── AI Feature Card ───────────────────────────────────────────────────────────

const AiFeatureCard = ({
  feature, enabled, onChange, disabled, masterEnabled,
}: {
  feature: any; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean; masterEnabled: boolean;
}) => {
  const Icon = IconMap[feature.icon] || Sparkles;
  const isEnabled = masterEnabled && enabled;

  return (
    <div className={`w-full sm:min-w-[280px] rounded-lg border transition-all h-full ${isEnabled ? "border-slate-200 bg-white shadow-sm" : "border-slate-100 bg-slate-50 opacity-80"}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className={`rounded-md p-1.5 shrink-0 ${isEnabled ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-400"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <p className={`text-sm font-bold truncate flex-1 sm:max-w-[160px] ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>{feature.label}</p>
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

// ── Normalise AI features ─────────────────────────────────────────────────────

function normalizeAi(raw: any): Record<string, boolean> {
  const defaults = COACHING_AI_FEATURES.reduce(
    (a, f) => ({ ...a, [f.key]: false }),
    {} as Record<string, boolean>
  );
  let parsed = raw;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { return defaults; }
  }
  // Backend stores aiFeatures as an array of enabled keys e.g. ["ai_study_assistant", "ai_analytics"]
  if (Array.isArray(parsed)) {
    const result = { ...defaults };
    parsed.forEach((key: string) => {
      if (key in result) result[key] = true;
    });
    return result;
  }
  // Fallback: if somehow stored as object map
  if (parsed && typeof parsed === "object") {
    return { ...defaults, ...parsed };
  }
  return defaults;
}

const STANDARD_FEATURES = [
  { key: 'live_lectures', label: 'Live Lectures', description: 'Teachers can host and students can join live classes', icon: 'Video' },
  { key: 'recorded_lectures', label: 'Recorded Lectures', description: 'Upload, manage, and process recorded classes with AI notes', icon: 'Video' },
  { key: 'mock_tests', label: 'Mock Tests', description: 'Create and assign full-length mock tests', icon: 'ClipboardList' },
  { key: 'doubt_queue', label: 'Doubt Queue', description: 'Students can raise doubts for teachers to answer', icon: 'MessageSquare' },
  { key: 'leaderboard', label: 'Leaderboard', description: 'Peer rankings and gamified performance', icon: 'Sparkles' },
  { key: 'calendar', label: 'Calendar', description: 'Institute-wide event and class scheduling', icon: 'CalendarCheck' },
  { key: 'pyq_bank', label: 'PYQ Bank', description: 'Previous year question bank for exam prep', icon: 'FileText' },
  { key: 'content_library', label: 'Content Library', description: 'Central repository for study materials', icon: 'FileText' },
  { key: 'notifications', label: 'Notifications', description: 'Push and email announcements to students', icon: 'MessageSquare' },
];

// ── Coaching Institute Row ────────────────────────────────────────────────────

const CoachingInstituteRow = ({
  institute, onSaved,
}: {
  institute: any; onSaved: (id: string, patch: any) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const aiEnabled: boolean = institute.ai_enabled ?? institute.aiEnabled ?? false;
  const aiFeatures = normalizeAi(institute.ai_features ?? institute.aiFeatures);
  const currentModules = institute.metadata?.modulesPermissions ?? {};

  const save = useCallback(async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/admin/tenants/${institute.id}`, patch);
      const updated = res.data?.data ?? res.data;
      onSaved(institute.id, updated);
      toast.success(`${institute.name} updated`);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [institute.id, institute.name, onSaved]);

  const toggleAiEnabled = (val: boolean) => save({ aiEnabled: val });
  const toggleAiFeature = (key: string, val: boolean) => {
    const updated = { ...aiFeatures, [key]: val };
    // Backend expects aiFeatures as an array of enabled keys
    const asArray = Object.entries(updated)
      .filter(([, enabled]) => enabled)
      .map(([k]) => k);
    save({ aiFeatures: asArray });
  };
  
  const toggleModule = (key: string, val: boolean) => {
    save({ modulesPermissions: { ...currentModules, [key]: val } });
  };

  return (
    <div className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-slate-50 border-b border-slate-200">
        <span className="text-[15px] sm:text-[18px] font-bold text-slate-900 flex-1">{institute.name}</span>

        {/* Global AI toggle */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[12px] sm:text-[14px] font-medium text-slate-700">Global AI</span>
          {saving ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-slate-400" />
          ) : (
            <Toggle enabled={aiEnabled} onChange={toggleAiEnabled} />
          )}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-lg bg-blue-50 text-blue-700 text-[12px] sm:text-[14px] font-semibold hover:bg-blue-100 transition-colors"
        >
          <span className="hidden sm:inline">{expanded ? "Hide Configuration" : "Configure"}</span>
          <span className="sm:hidden">{expanded ? "Hide" : "Config"}</span>
          {expanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
        </button>
      </div>

      {/* Expanded per-institute config */}
      {expanded && (
        <div className="p-3 sm:p-6 bg-slate-50/30">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              Standard Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {STANDARD_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={currentModules[f.key] ?? true}
                  onChange={(v) => toggleModule(f.key, v)}
                  disabled={saving}
                  masterEnabled={true}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              AI Features
              {!aiEnabled && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">
                  Disabled globally
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {COACHING_AI_FEATURES.map(f => (
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
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const CoachingFeatureFlagsPage = () => {
  const [aiDefaults, setAiDefaults] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("coaching_ai_feature_defaults");
      return s
        ? JSON.parse(s)
        : COACHING_AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {});
    } catch {
      return COACHING_AI_FEATURES.reduce((a, f) => ({ ...a, [f.key]: f.defaultEnabled }), {});
    }
  });

  const [standardDefaults, setStandardDefaults] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("coaching_standard_feature_defaults");
      return s
        ? JSON.parse(s)
        : STANDARD_FEATURES.reduce((a, f) => ({ ...a, [f.key]: true }), {});
    } catch {
      return STANDARD_FEATURES.reduce((a, f) => ({ ...a, [f.key]: true }), {});
    }
  });

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showGlobalStandardMobile, setShowGlobalStandardMobile] = useState(false);
  const [showGlobalAiMobile, setShowGlobalAiMobile] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAllInstitutes, setShowAllInstitutes] = useState(false);

  const filteredInstitutes = React.useMemo(() => {
    return institutes.filter(inst =>
      !searchQuery.trim() || inst.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [institutes, searchQuery]);

  const displayedInstitutes = showAllInstitutes ? filteredInstitutes : filteredInstitutes.slice(0, 4);

  useEffect(() => {
    localStorage.setItem("coaching_ai_feature_defaults", JSON.stringify(aiDefaults));
  }, [aiDefaults]);

  useEffect(() => {
    localStorage.setItem("coaching_standard_feature_defaults", JSON.stringify(standardDefaults));
  }, [standardDefaults]);

  useEffect(() => { loadInstitutes(); }, []);

  async function loadInstitutes() {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/tenants", { params: { page: 1, limit: 1000 } });
      const data = res.data?.data ?? res.data;
      const rawList =
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data) ? data :
        [];
      setInstitutes(rawList);
    } catch {
      toast.error("Failed to load coaching institutes");
    } finally {
      setLoading(false);
    }
  }

  const handleSaved = useCallback((id: string, updated: any) => {
    setInstitutes(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 pt-0 pb-24 sm:py-10 md:px-12 w-full font-sans text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">

        <header className="mt-4 sm:mt-0 border border-slate-200 rounded-2xl p-6 py-8 sm:pb-2 sm:p-0 sm:border-0 sm:rounded-none bg-white shadow-sm sm:shadow-none sm:bg-transparent">
          <h1 className="text-3xl sm:text-[32px] font-bold text-blue-600 tracking-tight">Feature Flags</h1>
          <p className="mt-1.5 sm:mt-2 font-medium text-slate-500 text-xs sm:text-[15px]">
            Control AI features globally or per coaching institute.
          </p>
        </header>

        {/* ── Global Defaults ───────────────────────────────────────────────── */}
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-0 sm:border-0 sm:rounded-none bg-white shadow-sm sm:shadow-none sm:bg-transparent">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg sm:text-[22px] font-bold text-slate-900 tracking-tight">Global Defaults</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Default AI feature settings for newly added coaching institutes.
            </p>
          </div>
          
          <div className="mb-8">
            <button
              onClick={() => setShowGlobalStandardMobile(prev => !prev)}
              className="w-full text-left text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">Standard Features</div>
              <div className="sm:hidden">
                {showGlobalStandardMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            <div className={`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${showGlobalStandardMobile ? "grid" : "hidden sm:grid"}`}>
              {STANDARD_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={standardDefaults[f.key] ?? true}
                  onChange={v => setStandardDefaults(p => ({ ...p, [f.key]: v }))}
                  masterEnabled={true}
                />
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowGlobalAiMobile(prev => !prev)}
              className="w-full text-left text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">AI Features</div>
              <div className="sm:hidden">
                {showGlobalAiMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            <div className={`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${showGlobalAiMobile ? "grid" : "hidden sm:grid"}`}>
              {COACHING_AI_FEATURES.map(f => (
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

        {/* ── Per-institute config ──────────────────────────────────────────── */}
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-0 sm:border-0 sm:rounded-none bg-white shadow-sm sm:shadow-none sm:bg-transparent sm:pt-4">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg sm:text-[22px] font-bold text-slate-900 tracking-tight">Institute Overrides</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Click <b>Configure</b> on any coaching institute to toggle AI features.
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search institutes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAllInstitutes(true);
                }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredInstitutes.length === 0 ? (
            <p className="py-8 text-[14px] text-slate-500">No coaching institutes found.</p>
          ) : (
            <div className="space-y-6">
              {displayedInstitutes.map(institute => (
                <CoachingInstituteRow
                  key={institute.id}
                  institute={institute}
                  onSaved={handleSaved}
                />
              ))}
              {!showAllInstitutes && filteredInstitutes.length > 4 && (
                <button
                  onClick={() => setShowAllInstitutes(true)}
                  className="w-full py-3 mt-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View All Institutes ({filteredInstitutes.length - 4} more)
                </button>
              )}
              {showAllInstitutes && filteredInstitutes.length > 4 && (
                <button
                  onClick={() => setShowAllInstitutes(false)}
                  className="w-full py-3 mt-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default CoachingFeatureFlagsPage;
