import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, Layers, Filter, 
  Search, ArrowRight, TrendingUp, Sparkles, Loader2, BookOpen
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function SyllabusTracker() {
  const [trackerData, setTrackerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTracker();
  }, []);

  const fetchTracker = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/tracker');
      const data = res.data?.data ?? res.data;
      if (data) {
        setTrackerData(data.tracker || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load syllabus tracker:', err);
      toast.error('Failed to load syllabus tracker data');
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

  const filtered = trackerData.filter(item => {
    const matchesSearch = item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
                          item.className.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Institutional Syllabus Tracker</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Real-time Progress
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Monitor planned vs actual teaching progress across classes, subjects, and topics.</p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Overall Completion</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary?.overallProgress || 0}%</span>
            <div className="p-2 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${summary?.overallProgress || 0}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Tracked Subjects</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary?.totalSubjects || 0}</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-3">Curriculum Subjects</p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">On Track</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{summary?.subjectsOnTrack || 0}</span>
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-3">Meeting target deadlines</p>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm dark:border-rose-900/30 dark:bg-rose-950/20">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">Behind Schedule</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-rose-900 dark:text-rose-100">{summary?.subjectsBehind || 0}</span>
            <div className="p-2 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/40">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-3">Action required</p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'ON_TRACK', 'BEHIND', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
            >
              {st === 'ALL' ? 'All Subjects' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(item => (
          <div key={item.subjectId + item.classId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">{item.className}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{item.subjectName}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'BEHIND' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {item.status === 'BEHIND' ? '7 Days Behind' : item.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Progress</span>
                <span>{item.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${item.status === 'BEHIND' ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} style={{ width: `${item.progressPercentage}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Chapters</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{item.totalChapters}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Done</p>
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-100 mt-0.5">{item.completedTopics}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-900/20">
                <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
                <p className="text-sm font-black text-amber-900 dark:text-amber-100 mt-0.5">{item.pendingTopics}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
