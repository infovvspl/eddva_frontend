import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Video, MessageSquare, Loader2, ChevronDown, ChevronUp, Search, Languages,
  SlidersHorizontal, Building2,
} from "lucide-react";
import { COACHING_AI_FEATURES } from "@/lib/constants/coachingAiFeatures";
import { COACHING_LANGUAGES } from "@/lib/constants/coachingLanguages";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

// Institute must keep at least one language enabled.
const MAX_ENABLED_LANGUAGES = 3;

// ── Icon map ─────────────────────────────────────────────────────────────────

const IconMap: Record<string, React.FC<any>> = {
  MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Video, MessageSquare, Sparkles, Languages,
};

// ── Toggle ────────────────────────────────────────────────────────────────────

const Toggle = ({
  enabled, onChange, disabled,
}: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    aria-pressed={enabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      ${enabled ? "bg-blue-600 shadow-inner shadow-blue-900/20 focus-visible:ring-blue-500" : "bg-slate-200 focus-visible:ring-slate-400"}
      ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-105"}`}
  >
    <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md transform transition-transform duration-200
      ${enabled ? "translate-x-[22px]" : "translate-x-1"}`} />
  </button>
);

// ── AI Feature Card ───────────────────────────────────────────────────────────

// Per-category accent so AI, Standard, and Language sections read as distinct
// groups at a glance, not just via their header text.
const ACCENTS = {
  blue:   { chip: "bg-blue-100 text-blue-600",     chipOff: "bg-slate-100 text-slate-400", ring: "hover:border-blue-200/80 hover:shadow-blue-500/5" },
  purple: { chip: "bg-purple-100 text-purple-600", chipOff: "bg-slate-100 text-slate-400", ring: "hover:border-purple-200/80 hover:shadow-purple-500/5" },
  teal:   { chip: "bg-teal-100 text-teal-600",     chipOff: "bg-slate-100 text-slate-400", ring: "hover:border-teal-200/80 hover:shadow-teal-500/5" },
} as const;

const AiFeatureCard = ({
  feature, enabled, onChange, disabled, masterEnabled, accent = "purple",
}: {
  feature: any; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean; masterEnabled: boolean;
  accent?: keyof typeof ACCENTS;
}) => {
  const Icon = IconMap[feature.icon] || Sparkles;
  const isEnabled = masterEnabled && enabled;
  const a = ACCENTS[accent];

  return (
    <div
      className={`w-full sm:min-w-[280px] rounded-xl border transition-all duration-200 h-full
        ${isEnabled ? `border-slate-200 bg-white shadow-sm hover:shadow-md ${a.ring}` : "border-slate-100 bg-slate-50/80 opacity-75"}`}
    >
      <div className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className={`rounded-lg p-2 shrink-0 transition-colors ${isEnabled ? a.chip : a.chipOff}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>{feature.label}</p>
              <p className="text-xs text-slate-500 truncate">{feature.description}</p>
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

// ── Section header ───────────────────────────────────────────────────────────

const SECTION_ICON_WRAP = {
  blue:   "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  teal:   "bg-teal-50 text-teal-600",
} as const;

const SectionHeader = ({
  icon: Icon, title, accent, badge, collapsible, open, onToggle,
}: {
  icon: React.FC<any>; title: string; accent: keyof typeof ACCENTS; badge?: React.ReactNode;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) => {
  const content = (
    <div className="flex items-center gap-2.5">
      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${SECTION_ICON_WRAP[accent]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-bold text-slate-700 tracking-tight">{title}</span>
      {badge}
    </div>
  );

  if (!collapsible) {
    return <div className="mb-4 pb-2.5 border-b border-slate-200/80 flex items-center justify-between">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left mb-4 pb-2.5 border-b border-slate-200/80 flex items-center justify-between gap-2"
    >
      {content}
      <div className="sm:hidden text-slate-400">
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
    </button>
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
  // Pre-migration institutes have no enabledLanguages value yet — default to all 3.
  const enabledLanguages: string[] =
    institute.enabled_languages ?? institute.enabledLanguages ?? COACHING_LANGUAGES.map((l) => l.key);

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

  const toggleLanguage = (key: string, val: boolean) => {
    if (val && enabledLanguages.length >= MAX_ENABLED_LANGUAGES && !enabledLanguages.includes(key)) {
      toast.error(`Only ${MAX_ENABLED_LANGUAGES} languages can be enabled at once`);
      return;
    }
    if (!val && enabledLanguages.length <= 1) {
      toast.error("At least one language must stay enabled");
      return;
    }
    const updated = val
      ? [...enabledLanguages, key]
      : enabledLanguages.filter((k) => k !== key);
    save({ enabledLanguages: updated });
  };

  return (
    <div className={`mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200
      ${expanded ? "border-blue-200/80 shadow-md shadow-blue-500/5" : "border-slate-200 hover:border-slate-300"}`}>
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="text-[15px] sm:text-[18px] font-bold text-slate-900 truncate">{institute.name}</span>
        </div>

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
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-lg text-[12px] sm:text-[14px] font-semibold transition-colors
            ${expanded ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
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
            <SectionHeader icon={SlidersHorizontal} title="Standard Features" accent="blue" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {STANDARD_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={currentModules[f.key] ?? true}
                  onChange={(v) => toggleModule(f.key, v)}
                  disabled={saving}
                  masterEnabled={true}
                  accent="blue"
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <SectionHeader
              icon={Languages}
              title="Languages"
              accent="teal"
              badge={
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                  {enabledLanguages.length} / {MAX_ENABLED_LANGUAGES} enabled
                </span>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {COACHING_LANGUAGES.map(l => (
                <AiFeatureCard
                  key={l.key}
                  feature={l}
                  enabled={enabledLanguages.includes(l.key)}
                  onChange={(v) => toggleLanguage(l.key, v)}
                  disabled={saving}
                  masterEnabled={true}
                  accent="teal"
                />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              icon={Sparkles}
              title="AI Features"
              accent="purple"
              badge={
                !aiEnabled && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Disabled globally
                  </span>
                )
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {COACHING_AI_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={aiFeatures[f.key] ?? true}
                  onChange={(v) => toggleAiFeature(f.key, v)}
                  disabled={saving || !aiEnabled}
                  masterEnabled={aiEnabled}
                  accent="purple"
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

  const [languageDefaults, setLanguageDefaults] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("coaching_language_defaults");
      if (s) return JSON.parse(s);
    } catch { /* fall through to default */ }
    return COACHING_LANGUAGES.map((l) => l.key);
  });

  const toggleLanguageDefault = (key: string, val: boolean) => {
    if (val && languageDefaults.length >= MAX_ENABLED_LANGUAGES && !languageDefaults.includes(key)) {
      toast.error(`Only ${MAX_ENABLED_LANGUAGES} languages can be enabled at once`);
      return;
    }
    if (!val && languageDefaults.length <= 1) {
      toast.error("At least one language must stay enabled");
      return;
    }
    setLanguageDefaults((prev) => (val ? [...prev, key] : prev.filter((k) => k !== key)));
  };

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showGlobalStandardMobile, setShowGlobalStandardMobile] = useState(false);
  const [showGlobalAiMobile, setShowGlobalAiMobile] = useState(false);
  const [showGlobalLanguageMobile, setShowGlobalLanguageMobile] = useState(false);

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

  useEffect(() => {
    localStorage.setItem("coaching_language_defaults", JSON.stringify(languageDefaults));
  }, [languageDefaults]);

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
    <div className="w-full space-y-4 sm:space-y-6 font-sans text-slate-900">
      <div className="w-full space-y-4 sm:space-y-6">

        <header className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5 bg-gradient-to-br from-blue-50 via-blue-100/70 to-indigo-50 border border-blue-200/80 rounded-2xl px-5 pt-5 pb-3.5 sm:p-6 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 dark:bg-blue-950/20 dark:border-blue-900/50">
          <span className="hidden sm:inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white text-blue-600 shadow-sm shrink-0">
            <SlidersHorizontal className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-slate-900 tracking-tight">Feature Flags</h1>
            <p className="mt-1 font-medium text-slate-500 text-xs sm:text-sm">
              Control AI features globally or per coaching institute.
            </p>
          </div>
        </header>

        {/* ── Global Defaults ───────────────────────────────────────────────── */}
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg sm:text-[22px] font-bold text-slate-900 tracking-tight">Global Defaults</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Default AI feature settings for newly added coaching institutes.
            </p>
          </div>

          <div className="mb-8">
            <SectionHeader
              icon={SlidersHorizontal}
              title="Standard Features"
              accent="blue"
              collapsible
              open={showGlobalStandardMobile}
              onToggle={() => setShowGlobalStandardMobile(prev => !prev)}
            />
            <div className={`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${showGlobalStandardMobile ? "grid" : "hidden sm:grid"}`}>
              {STANDARD_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={standardDefaults[f.key] ?? true}
                  onChange={v => setStandardDefaults(p => ({ ...p, [f.key]: v }))}
                  masterEnabled={true}
                  accent="blue"
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <SectionHeader
              icon={Languages}
              title="Languages"
              accent="teal"
              collapsible
              open={showGlobalLanguageMobile}
              onToggle={() => setShowGlobalLanguageMobile(prev => !prev)}
              badge={
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                  {languageDefaults.length} / {MAX_ENABLED_LANGUAGES} enabled
                </span>
              }
            />
            <div className={`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${showGlobalLanguageMobile ? "grid" : "hidden sm:grid"}`}>
              {COACHING_LANGUAGES.map(l => (
                <AiFeatureCard
                  key={l.key}
                  feature={l}
                  enabled={languageDefaults.includes(l.key)}
                  onChange={v => toggleLanguageDefault(l.key, v)}
                  masterEnabled={true}
                  accent="teal"
                />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              icon={Sparkles}
              title="AI Features"
              accent="purple"
              collapsible
              open={showGlobalAiMobile}
              onToggle={() => setShowGlobalAiMobile(prev => !prev)}
            />
            <div className={`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${showGlobalAiMobile ? "grid" : "hidden sm:grid"}`}>
              {COACHING_AI_FEATURES.map(f => (
                <AiFeatureCard
                  key={f.key}
                  feature={f}
                  enabled={aiDefaults[f.key] ?? f.defaultEnabled}
                  onChange={v => setAiDefaults(p => ({ ...p, [f.key]: v }))}
                  masterEnabled={true}
                  accent="purple"
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Per-institute config ──────────────────────────────────────────── */}
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg sm:text-[22px] font-bold text-slate-900 tracking-tight">Institute Overrides</h2>
            <p className="text-xs sm:text-[14px] text-slate-500">
              Click <b>Configure</b> on any coaching institute to toggle AI features.
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search institutes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAllInstitutes(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
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
