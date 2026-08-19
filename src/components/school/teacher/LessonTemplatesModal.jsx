import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, BookOpen, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function LessonTemplatesModal({ isOpen, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/templates');
      const data = res.data?.data ?? res.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const defaultTemplates = [
    {
      id: 'def-1',
      title: 'Standard Concept Lesson Plan',
      category: 'Standard',
      contentJson: {
        teachingMethodology: 'Concept Explanation, Board Work, Guided Practice',
        assessmentMethod: 'Short 3-question Check',
        teachingResources: 'Textboard & Worksheets'
      }
    },
    {
      id: 'def-2',
      title: 'Practical / Lab Experiment',
      category: 'Practical/Lab',
      contentJson: {
        teachingMethodology: 'Safety Briefing, Hands-on Experiment, Lab Journal Recording',
        assessmentMethod: 'Lab Journal Verification',
        teachingResources: 'Lab Equipment, Safety Goggles, Apparatus'
      }
    },
    {
      id: 'def-3',
      title: 'Revision & Doubts Solving',
      category: 'Revision',
      contentJson: {
        teachingMethodology: 'Summary Review, Mind-map on Board, Doubt Resolution',
        assessmentMethod: 'Quick Oral Quiz',
        teachingResources: 'Revision Worksheets & Previous Years Questions'
      }
    }
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Lesson Plan Templates Library</h2>
            <p className="text-xs text-slate-500">Pick a standard, lab, or revision template to quickly populate your lesson plan.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTemplate?.(t.contentJson);
                  toast.success(`Loaded template "${t.title}"`);
                  onClose();
                }}
                className="cursor-pointer rounded-2xl border border-slate-200 p-4 hover:border-blue-600 hover:bg-blue-50/50 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50 space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t.category}</span>
                  <CheckCircle2 size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{t.contentJson?.teachingMethodology}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
