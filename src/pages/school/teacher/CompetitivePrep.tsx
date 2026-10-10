import React, { useEffect, useState } from 'react';
import { Trophy, Loader2, Sparkles } from 'lucide-react';
import * as competitiveApi from '@/lib/api/competitive';
import { handleApiError } from '@/lib/school/errorHandler';

interface MyAssignment {
  id: string;
  display_name?: string | null;
  master_subject_name: string;
  class_name?: string;
  class_id: string;
}

export default function CompetitivePrep() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setAssignments(await competitiveApi.listMyCompetitiveAssignments());
      } catch (err) {
        handleApiError(err, 'Failed to load your competitive assignments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Competitive Exam Prep</h1>
          <p className="text-slate-500 text-sm">The classes you've been assigned to teach competitive-exam content for.</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
          You haven't been assigned any competitive subjects yet — ask your Institute Admin to assign you one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-800">{a.display_name || a.master_subject_name}</p>
                <p className="text-xs text-slate-400">{a.master_subject_name} · {a.class_name}</p>
              </div>
              <button
                disabled
                title="Coming soon — AI generation for this vertical is still being built"
                className="mt-4 h-10 px-4 rounded-xl bg-slate-100 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> Generate Practice Questions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
