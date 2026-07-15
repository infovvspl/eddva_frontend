import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { BarChart3, TrendingUp, Target, BrainCircuit, Activity, Clock, AlertTriangle, GraduationCap, FileText } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import GlassCard from '@/components/school/GlassCard';
import Badge from '@/components/school/Badge';
import '@/pages/school/teacher/StudentReportClasses.css';

export default function Analytics() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [performance, setPerformance] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    setStudentLoading(true);
    try {
      const res = await api.get('/students/profile/me');
      setStudent(res.data?.data || res.data);
    } catch (e) {
      console.error('Failed to fetch student profile:', e);
    } finally {
      setStudentLoading(false);
    }
  };

  const getClassNumberFromName = (className = '') => {
    const cls = String(className || '').toLowerCase();
    const numeric = cls.match(/\b(?:class|grade|standard|std)?\s*(\d{1,2})\b/);
    if (numeric) return Number(numeric[1]);

    const romanMap = {
      i: 1, ii: 2, iii: 3, iv: 4, v: 5,
      vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12
    };
    const tokens = cls.split(/[^a-z0-9]+/).filter(Boolean);
    const roman = tokens.find((token) => romanMap[token]);
    return roman ? romanMap[roman] : null;
  };

  const isBoardResultClass = (className = '') => {
    const classNumber = getClassNumberFromName(className);
    return classNumber === 10 || classNumber === 12;
  };

  const isPrePrimaryResultClass = (className = '') => {
    const cls = String(className || '').toLowerCase();
    return cls.includes('lkg') || cls.includes('ukg') || cls.includes('nursery') || cls.includes('pre');
  };

  const isInformationTechnologySubject = (subjectName = '') => {
    const subject = String(subjectName || '').trim().toLowerCase();
    return /\b(information|informational)\s+technology\b/.test(subject) || 
           /\bcomputer\s+science\b/.test(subject) ||
           /\bcomputer\b/.test(subject) ||
           subject === 'it' || 
           subject === 'cs';
  };

  const calculateReportCardPercentage = (recordsList, className) => {
    const isBoard = isBoardResultClass(className);
    const isPrePrimary = isPrePrimaryResultClass(className);

    const subjectResults = recordsList.filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
    if (!subjectResults.length) return 0;
    if (isPrePrimary) return 0;

    const subjectMap = {};
    subjectResults.forEach((res) => {
      const sub = res.subjectName || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(res);
    });

    let subjectFinals = [];

    Object.entries(subjectMap).forEach(([subject, records]) => {
      const isIT = isInformationTechnologySubject(subject);
      
      if (isBoard) {
        let obtained = 0, max = 0;
        records.forEach((rec) => {
          try {
            if (rec.remarks && String(rec.remarks).trim().startsWith('{')) {
              const parsed = JSON.parse(rec.remarks);
              if (parsed?.type === 'breakdown' && parsed.components) {
                Object.values(parsed.components).forEach((comp) => {
                  if (comp && comp.enabled) {
                    obtained += Number(comp.obtained || 0);
                    max += Number(comp.max || 0);
                  }
                });
              }
            } else {
              obtained += Number(rec.marksObtained || 0);
              max += Number(rec.totalMarks || 100);
            }
          } catch (e) {
            obtained += Number(rec.marksObtained || 0);
            max += Number(rec.totalMarks || 100);
          }
        });
        const finalVal = max > 0 ? (obtained / max) * 100 : 0;
        subjectFinals.push(finalVal);
      } else {
        const slotMap = new Map();
        const getTermSlot = (titleStr) => {
          const title = titleStr.toLowerCase();
          if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              return 't1Internal';
            }
            if (isIT) {
              if (title.includes('practical')) return 'halfYearlyPractical';
              if (title.includes('theory')) return 'halfYearlyTheory';
            }
            return 'halfYearly';
          }
          if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              return 't2Internal';
            }
            if (isIT) {
              if (title.includes('practical')) return 'annualPractical';
              if (title.includes('theory')) return 'annualTheory';
            }
            return 'annual';
          }
          return null;
        };

        [...records]
          .sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return aTime - bTime;
          })
          .forEach((rec) => {
            const slot = getTermSlot(rec.assessmentTitle || '');
            if (slot) {
              slotMap.set(slot, rec);
            }
          });

        let t1Int = 0, h1Exam = 0;
        let t2Int = 0, aExam = 0;
        let theoryObtained = 0, theoryMax = 0;
        let internalObtained = 0;

        Array.from(slotMap.values()).forEach((rec) => {
          const title = (rec.assessmentTitle || '').toLowerCase();
          const marks = Number(rec.marksObtained || 0);
          if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              t1Int += marks;
            } else {
              h1Exam += marks;
            }
          } else if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              t2Int += marks;
            } else {
              aExam += marks;
            }
          }
          
          try {
            if (rec.remarks && rec.remarks.trim().startsWith('{')) {
              const parsed = JSON.parse(rec.remarks);
              if (parsed.type === 'breakdown' && parsed.components) {
                const comps = parsed.components;
                if (comps.theory?.enabled) {
                  theoryObtained += Number(comps.theory.obtained || 0);
                  theoryMax += Number(comps.theory.max || 0);
                }
                if (comps.internal?.enabled) {
                  internalObtained += Number(comps.internal.obtained || 0);
                }
              }
            } else {
              theoryObtained += Number(rec.marksObtained || 0);
              theoryMax += Number(rec.totalMarks || 100);
            }
          } catch (e) {
            theoryObtained += Number(rec.marksObtained || 0);
            theoryMax += Number(rec.totalMarks || 100);
          }
        });

        if (h1Exam === 0 && aExam === 0) {
          h1Exam = Math.round(theoryObtained * 0.4);
          aExam = Math.round(theoryObtained * 0.5);
          t1Int = Math.round(internalObtained || (theoryObtained * 0.05));
          t2Int = Math.round(internalObtained || (theoryObtained * 0.05));
        }

        let h1Max = 80, aMax = 80;
        Array.from(slotMap.values()).forEach((rec) => {
          const title = (rec.assessmentTitle || '').toLowerCase();
          const maxVal = Number(rec.totalMarks || 0);
          if (maxVal > 0) {
            if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
              if (!title.includes('internal') && !title.includes('periodic') && !title.includes('unit')) {
                h1Max = maxVal;
              }
            } else if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
              if (!title.includes('internal') && !title.includes('periodic') && !title.includes('unit')) {
                aMax = maxVal;
              }
            }
          }
        });

        let finalVal = 0;
        if (isIT) {
          finalVal = (h1Exam + aExam) / 2;
        } else {
          const hyScaled = h1Max > 0 ? (h1Exam / h1Max) * 30 : 0;
          const annualScaled = aMax > 0 ? (aExam / aMax) * 50 : 0;
          const internalScaled = (t1Int + t2Int) / 2;
          finalVal = hyScaled + internalScaled + annualScaled;
        }
        subjectFinals.push(Math.min(100, Math.round(finalVal * 100) / 100));
      }
    });

    const sum = subjectFinals.reduce((acc, val) => acc + val, 0);
    return subjectFinals.length > 0 ? Math.round((sum / subjectFinals.length) * 100) / 100 : 0;
  };

  const resultsByClass = useMemo(() => {
    if (!student) return {};
    const profile = student.studentProfile || {};
    const currentClassName = profile.section?.class?.name;
    const previousResultsList = student.previousResults || [];

    const grouped = {};
    previousResultsList.forEach((res) => {
      if (!res.className) return;
      const isCurrent = res.className === currentClassName;
      const key = isCurrent 
        ? `${res.className} (Ongoing Class)` 
        : `${res.className} (${res.academicYear || 'N/A'})`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(res);
    });
    return grouped;
  }, [student]);

  const currentClassSubjectMastery = useMemo(() => {
    if (!student) return [];
    const profile = student.studentProfile || {};
    const currentClassName = profile.section?.class?.name;
    const previousResultsList = student.previousResults || [];

    const currentResults = previousResultsList.filter(
      (res) => res.className === currentClassName && res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)')
    );

    const subjectMap = {};
    currentResults.forEach((res) => {
      if (res.isAbsent) return;
      const sub = res.subjectName;
      if (!subjectMap[sub]) subjectMap[sub] = [];
      
      const totalMarks = res.totalMarks ? Number(res.totalMarks) : 100;
      const percentage = res.percentage !== null && res.percentage !== undefined
        ? Number(res.percentage)
        : totalMarks ? (Number(res.marksObtained || 0) / totalMarks) * 100 : 0;
      
      subjectMap[sub].push(percentage);
    });

    const masteryList = Object.entries(subjectMap).map(([subjectName, values]) => {
      const avg = values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
      return {
        subjectName,
        accuracy: avg
      };
    });

    return masteryList.sort((a, b) => b.accuracy - a.accuracy);
  }, [student]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/my-analytics');
      const data = res.data?.data || null;
      setPerformance(data);
      setInsights(data?.insights || null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setPerformance(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !performance) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 px-3 pb-20 sm:space-y-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" /> Performance Analytics
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Track your learning progress and get AI insights.</p>
        </div>
        {performance?.profile && (
          <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit">
            {[performance.profile.class_name, performance.profile.section_name].filter(Boolean).join(' - ')}
          </div>
        )}
      </div>

      {(!performance || performance.questionsAttempted === 0) && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-slate-100 border-dashed bg-white p-8 sm:p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Activity className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">No analytics available</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Your analytics will appear after your teacher publishes assessment results.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          
          {/* Key Metrics */}
          <div className="md:col-span-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Target className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.overallAccuracy || 0}%</p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TrendingUp className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Practiced</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.questionsAttempted || 0}</p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Clock className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Study Time</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                {Math.floor((performance?.totalTimeSpentSeconds || 0) / 3600)}h
              </p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Activity className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Streak</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.streakDays || 0} days</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            {/* Subject Mastery */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-black text-slate-900 dark:text-white">Subject Mastery</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {currentClassSubjectMastery.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500">Not enough data to calculate mastery.</p>
                ) : (
                  currentClassSubjectMastery.map((sub, i) => (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{sub.subjectName}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{sub.accuracy}%</span>
                      </div>
                      <div className="h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className="h-full rounded-full bg-indigo-600 transition-all duration-1000" 
                          style={{ width: `${sub.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Class Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <GraduationCap className="text-indigo-600 h-4 w-4" /> Academic Report Cards
              </h3>
              {Object.keys(resultsByClass).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(resultsByClass).map(([classKey, results]) => {
                    const classNameVal = results[0]?.className || classKey;
                    const academicYearVal = results[0]?.academicYear || '';
                    const subjectResults = results.filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
                    const subjectsList = [...new Set(subjectResults.map((res) => res.subjectName).filter(Boolean))];
                    const subjectsDisplay = subjectsList.length > 0 ? subjectsList.join(', ') : 'General / All Subjects';
                    const overallPercentage = calculateReportCardPercentage(results, classNameVal);

                    return (
                      <GlassCard
                        key={classKey}
                        onClick={() => navigate(`/school/student/analytics/report-card?class=${encodeURIComponent(classNameVal)}&year=${encodeURIComponent(academicYearVal)}`)}
                        className="group relative cursor-pointer p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-48 active:scale-[0.99] student-report-classes__card"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider">
                              {academicYearVal || 'Academic Year'}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                              <FileText size={16} />
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                            {classNameVal}
                          </h4>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-clamp-2 pr-4 leading-normal">
                            Subjects: {subjectsDisplay}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Overall weighted result</div>
                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 mt-0.5">Report Card Score</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{overallPercentage}%</div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400">No report cards available yet.</p>
                </div>
              )}
            </div>
            
            {/* AI Insights */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-6 shadow-sm dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-slate-900">
              <h2 className="mb-3 text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" /> AI Learning Insights
              </h2>
              
              {insights?.summary ? (
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {insights.summary}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500">More data needed to generate personalized AI insights.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Weak Areas */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3.5 text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500 h-5 w-5 sm:h-6 sm:w-6" /> Focus Areas
              </h2>
              
              <div className="space-y-2.5 sm:space-y-3">
                {performance?.weakTopics?.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500">No weak areas identified yet. Keep up the good work!</p>
                ) : (
                  performance?.weakTopics?.map((topic, i) => (
                    <div key={i} className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 sm:p-3 dark:border-rose-900/30 dark:bg-rose-900/10">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{topic.name}</p>
                      <p className="mt-1 flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="text-slate-500">{topic.subjectName}</span>
                        <span className="text-rose-600">{topic.accuracy}% accuracy</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              {performance?.weakTopics?.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/school/student/planner')}
                  className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Practice Weak Topics
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
