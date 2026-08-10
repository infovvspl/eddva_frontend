import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Sparkles, Loader2, FileText } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function StudentSyllabusView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/student-progress');
      const resData = res.data?.data ?? res.data;
      if (resData) {
        setData(resData);
      }
    } catch (err) {
      console.error('Failed to load student syllabus progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const subjects = data?.subjects || [];

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Academic Syllabus Progress</h1>
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
          Student Portal
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map(sub => (
          <div key={sub.subjectId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{sub.subjectName}</h3>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{sub.progressPercentage}%</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${sub.progressPercentage}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Completed Topics: <strong>{sub.completedTopics}</strong> / {sub.totalTopics}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
