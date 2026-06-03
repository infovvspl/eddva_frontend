import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MessageCircleQuestion, FileText, ClipboardList, CalendarCheck, CheckSquare, TrendingUp, FileBarChart } from "lucide-react";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";
import api from "@/lib/api/school-client";
import { toast } from "sonner";

const Toggle = ({ enabled, onChange, disabled, size = 'md' }: { enabled: boolean, onChange: (v: boolean) => void, disabled?: boolean, size?: 'sm' | 'md' }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={`
        relative inline-flex items-center rounded-full
        transition-colors duration-200 focus:outline-none shrink-0
        ${size === 'sm' ? 'w-8 h-4' : 'w-11 h-6'}
        ${enabled ? 'bg-blue-600' : 'bg-surface-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={`
        inline-block rounded-full bg-white shadow
        transform transition-transform duration-200
        ${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        ${enabled
          ? size === 'sm' ? 'translate-x-4' : 'translate-x-6'
          : 'translate-x-1'
        }
      `}/>
    </button>
  );
};

const AiIconMap: Record<string, React.FC<any>> = {
  MessageCircleQuestion,
  FileText,
  ClipboardList,
  CalendarCheck,
  CheckSquare,
  TrendingUp,
  FileBarChart,
  Sparkles,
};

const FeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [defaults, setDefaults] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ai_feature_defaults');
    if (saved) return JSON.parse(saved);
    return AI_FEATURES.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultEnabled }), {});
  });

  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('ai_feature_defaults', JSON.stringify(defaults));
  }, [defaults]);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    try {
      setLoading(true);
      const res = await api.get('/institutes', { params: { perPage: 1000 } });
      const data = res.data?.data;
      const rawList = Array.isArray(data) ? data : (data?.items || res.data?.items || []);
      setSchools(rawList);
    } catch (err) {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }

  function handleDefaultToggle(key: string, val: boolean) {
    setDefaults(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold text-slate-900">Feature Flags</h1>
          <p className="text-slate-500 mt-2 font-medium">Control AI features available across all schools.</p>
        </header>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Global Defaults</h2>
          <p className="text-sm text-slate-500 mt-1">Default settings applied to newly created schools.</p>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-2">
            <span>ℹ️</span>
            <p>These defaults apply to new schools only. To change settings for existing schools, go to the school detail page.</p>
          </div>

          <div className="mt-6 space-y-3">
            {AI_FEATURES.map((feature) => {
              const IconComp = AiIconMap[feature.icon] || Sparkles;
              return (
                <div key={feature.key} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${defaults[feature.key] ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${defaults[feature.key] ? 'text-slate-900' : 'text-slate-500'}`}>{feature.label}</p>
                      <p className="text-xs text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                  <Toggle
                    enabled={defaults[feature.key] ?? false}
                    onChange={(val) => handleDefaultToggle(feature.key, val)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Schools Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Manage AI access for existing schools.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4 pl-6">School Name</th>
                  <th className="p-4">AI Enabled</th>
                  <th className="p-4">Features Active</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">Loading schools...</td>
                  </tr>
                ) : schools.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">No schools found.</td>
                  </tr>
                ) : (
                  schools.map(school => {
                    const aiEnabled = school.aiEnabled || false;
                    const activeFeatures = aiEnabled && school.aiFeatures ? Object.values(school.aiFeatures).filter(Boolean).length : 0;
                    
                    return (
                      <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-medium text-slate-900">{school.name}</td>
                        <td className="p-4">
                          {aiEnabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                              <Sparkles className="w-3.5 h-3.5" />
                              On
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                              Off
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {activeFeatures} / {AI_FEATURES.length} features
                        </td>
                        <td className="p-4 text-right pr-6">
                          <button
                            onClick={() => navigate(`/school/admin/institutes`)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
