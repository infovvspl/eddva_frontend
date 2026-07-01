import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck,
  Video, MessageSquare, Loader2, ChevronDown, ChevronUp,
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
    <div className={`min-w-[280px] rounded-lg border transition-all h-full ${isEnabled ? "border-slate-200 bg-white shadow-sm" : "border-slate-100 bg-slate-50 opacity-80"}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className={`rounded-md p-1.5 shrink-0 ${isEnabled ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-400"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col min-w-0 flex-1 justify-center">
              <p className={`text-sm font-bold truncate ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>{feature.label}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5" title={feature.description}>{feature.description}</p>
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
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-slate-50 border-b border-slate-200">
        <span className="text-[18px] font-bold text-slate-900 flex-1">{institute.name}</span>

        {/* Global AI toggle */}
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

      {/* Expanded per-institute config */}
      {expanded && (
        <div className="p-6 bg-slate-50/30">
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
            <div className="space-y-6">
              {['teacher', 'student', 'both'].map(category => {
                const features = COACHING_AI_FEATURES.filter(f => (f as any).category === category);
                if (!features.length) return null;
                return (
                  <div key={category} className="rounded-lg p-4 bg-white/50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      {category === 'teacher' ? 'Teacher Features' : category === 'student' ? 'Student Features' : 'Shared Features (Both)'} ({features.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {features.map(f => (
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
                );
              })}
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
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-10 md:px-12 w-full font-sans text-slate-900 pb-24">
      <div className="mx-auto max-w-[1600px] space-y-10">

        <header className="pb-2">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Feature Flags</h1>
          <p className="mt-2 font-medium text-slate-500 text-[15px]">
            Control AI features globally or per coaching institute.
          </p>
        </header>

        {/* ── Global Defaults ───────────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Global Defaults</h2>
            <p className="text-[14px] text-slate-500">
              Default AI feature settings for newly added coaching institutes.
            </p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              Standard Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              AI Features
            </h3>
            <div className="space-y-6">
              {['teacher', 'student', 'both'].map(category => {
                const features = COACHING_AI_FEATURES.filter(f => (f as any).category === category);
                if (!features.length) return null;
                return (
                  <div key={category} className="rounded-lg p-4 bg-white/50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      {category === 'teacher' ? 'Teacher Features' : category === 'student' ? 'Student Features' : 'Shared Features (Both)'} ({features.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {features.map(f => (
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
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Per-institute config ──────────────────────────────────────────── */}
        <section className="pt-4">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Institute Overrides</h2>
            <p className="text-[14px] text-slate-500">
              Click <b>Configure</b> on any coaching institute to toggle AI features.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : institutes.length === 0 ? (
            <p className="py-8 text-[14px] text-slate-500">No coaching institutes found.</p>
          ) : (
            <div className="space-y-6">
              {institutes.map(institute => (
                <CoachingInstituteRow
                  key={institute.id}
                  institute={institute}
                  onSaved={handleSaved}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default CoachingFeatureFlagsPage;
