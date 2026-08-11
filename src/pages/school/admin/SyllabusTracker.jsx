import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, Layers, Filter, 
  Search, ArrowRight, TrendingUp, Sparkles, Loader2, BookOpen, Users 
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

import { unwrapSchoolList } from '@/lib/api/school-client';

export default function SyllabusTracker() {
  const [trackerData, setTrackerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // 3-Level State: selectedClassId -> selectedSectionId (or 'ALL_SECTIONS')
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [registeredClasses, setRegisteredClasses] = useState([]);

  useEffect(() => {
    fetchTracker();
  }, []);

  const fetchTracker = async () => {
    setLoading(true);
    try {
      const [trackerRes, secRes, clsRes] = await Promise.all([
        api.get('/syllabus/tracker').catch(() => ({ data: [] })),
        api.get('/academic/sections').catch(() => ({ data: [] })),
        api.get('/academic/classes').catch(() => ({ data: [] }))
      ]);
      
      const data = trackerRes.data?.data ?? trackerRes.data;
      if (data) {
        setTrackerData(data.tracker || []);
        setSummary(data.summary || null);
      }
      setAllSections(unwrapSchoolList(secRes));
      setRegisteredClasses(unwrapSchoolList(clsRes));
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

  // Build class master list combining registered school classes and tracker data
  const masterClassMap = {};

  // First add all registered school classes
  registeredClasses.forEach(cls => {
    masterClassMap[cls.id] = {
      classId: cls.id,
      className: cls.name,
      items: []
    };
  });

  // Attach tracker plan items
  trackerData.forEach(item => {
    let targetKey = item.classId;
    if (!targetKey || !masterClassMap[targetKey]) {
      // Find key by matching class name
      const foundEntry = Object.values(masterClassMap).find(c => c.className?.toLowerCase() === item.className?.toLowerCase());
      if (foundEntry) {
        targetKey = foundEntry.classId;
      } else {
        targetKey = item.classId || 'unassigned';
      }
    }

    if (!masterClassMap[targetKey]) {
      masterClassMap[targetKey] = {
        classId: item.classId,
        className: item.className || 'General Class',
        items: []
      };
    }
    masterClassMap[targetKey].items.push(item);
  });

  const classList = Object.values(masterClassMap).sort((a, b) => {
    const numA = parseInt((a.className || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.className || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.className || '').localeCompare(b.className || '');
  });

  const selectedClassGroup = selectedClassId ? masterClassMap[selectedClassId] : null;

  // Determine sections for selected class
  let classSections = [];
  if (selectedClassId) {
    classSections = allSections.filter(s => s.class_id === selectedClassId || s.classId === selectedClassId);
  }

  // Filter plans when both class and section are selected
  let activeSectionItems = [];
  if (selectedClassGroup && selectedSectionId) {
    if (selectedSectionId === 'ALL_SECTIONS') {
      activeSectionItems = selectedClassGroup.items;
    } else {
      const targetSecObj = classSections.find(s => s.id === selectedSectionId);
      const targetSecName = targetSecObj?.name;

      activeSectionItems = selectedClassGroup.items.filter(i => {
        if (!i.sectionId && !i.sectionName) return true; // Plan applies to all sections
        if (i.sectionId === selectedSectionId) return true;
        if (i.sectionName === selectedSectionId) return true;
        if (targetSecName && (i.sectionName === targetSecName || i.sectionName === `Section ${targetSecName}`)) return true;
        return false;
      });

      // Fallback: If no plan explicitly matched section_id, show all class plans
      if (activeSectionItems.length === 0) {
        activeSectionItems = selectedClassGroup.items;
      }
    }
  }

  const filteredPlans = activeSectionItems.filter(item => {
    const matchesSearch = item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
                          item.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedSectionId ? (
              <button
                onClick={() => setSelectedSectionId(null)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all mr-1 text-xs font-bold"
              >
                ← Back to Sections
              </button>
            ) : selectedClassGroup ? (
              <button
                onClick={() => setSelectedClassId(null)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all mr-1 text-xs font-bold"
              >
                ← Back to Classes
              </button>
            ) : null}
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {selectedSectionId 
                ? `${selectedClassGroup?.className} — ${selectedSectionId === 'ALL_SECTIONS' ? 'Entire Class' : `Section ${classSections.find(s => s.id === selectedSectionId)?.name || ''}`}`
                : selectedClassGroup 
                ? `${selectedClassGroup.className} Sections`
                : 'Syllabus Tracker'}
            </h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Assigned Plans Progress
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {selectedSectionId
              ? `Real-time progress for syllabus plans allocated in Syllabus Planner.`
              : selectedClassGroup
              ? `Select a section in ${selectedClassGroup.className} to view assigned subject plans.`
              : 'Select a class card to inspect section breakdown and assigned syllabus plans.'}
          </p>
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
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Assigned Plans</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary?.totalSubjects || trackerData.length}</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-3">Published Target Plans</p>
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

      {/* LEVEL 1: CLASS CARDS GRID */}
      {!selectedClassId && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Select Class to Inspect Assigned Plans</h3>
          {classList.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No assigned syllabus plans</h3>
              <p className="mt-1 text-xs text-slate-500">Publish target plans in Syllabus Planner first.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classList.map(cls => {
                const totalSub = cls.items.length;
                const completedSub = cls.items.filter(i => i.status === 'COMPLETED' || i.progressPercentage >= 100).length;
                const avgProgress = Math.round(cls.items.reduce((a, b) => a + (b.progressPercentage || 0), 0) / (totalSub || 1));

                return (
                  <div
                    key={cls.classId || cls.className}
                    onClick={() => { setSelectedClassId(cls.classId); setSelectedSectionId(null); }}
                    className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Layers size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{cls.className}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{totalSub} Assigned Plan{totalSub === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Class Syllabus Progress</span>
                        <span>{avgProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <span>Completed: <strong className="text-slate-900 dark:text-white">{completedSub} / {totalSub}</strong></span>
                      <span className="text-blue-600 font-bold group-hover:underline">Open Sections →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: SECTION CARDS GRID */}
      {selectedClassId && !selectedSectionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {selectedClassGroup?.className} — Select Section
            </h3>
            <p className="text-xs font-semibold text-slate-500">Available Class Sections</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card for Entire Class */}
            <div
              onClick={() => setSelectedSectionId('ALL_SECTIONS')}
              className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Entire Class</h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedClassGroup?.items.length || 0} Total Plans</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                View all assigned syllabus target plans across all sections of {selectedClassGroup?.className}.
              </p>
            </div>

            {/* Individual Section Cards */}
            {classSections.map(sec => {
              const secPlans = selectedClassGroup?.items.filter(i => i.sectionId === sec.id || i.sectionName === sec.name) || [];
              const avgProgress = Math.round(secPlans.reduce((a, b) => a + (b.progressPercentage || 0), 0) / (secPlans.length || 1));

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Layers size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Section {sec.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{secPlans.length} Assigned Plan{secPlans.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Section Progress</span>
                      <span>{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                    <span>View Section Plans</span>
                    <span className="text-blue-600 font-bold group-hover:underline">Inspect Plans →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 3: ASSIGNED SYLLABUS TARGET PLAN CARDS */}
      {selectedClassId && selectedSectionId && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or teacher…"
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
                  {st === 'ALL' ? 'All Plans' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No assigned plans found</h3>
              <p className="mt-1 text-xs text-slate-500">No matching published target plans found for this selection.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map(item => (
                <div key={item.planId || item.subjectId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">{item.className}</span>
                        {item.term && <span className="text-[10px] font-bold text-slate-400">· {item.term}</span>}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{item.subjectName}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Teacher: <strong className="text-slate-800 dark:text-slate-200">{item.teacherName}</strong></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'BEHIND' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.status === 'BEHIND' ? 'Behind' : item.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Target Completion Progress</span>
                      <span>{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.status === 'BEHIND' ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} style={{ width: `${item.progressPercentage}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Periods</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{item.plannedPeriods || 1}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Completed</p>
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
          )}
        </div>
      )}
    </div>
  );
}
