import React, { useEffect, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { getApiOrigin } from '@/lib/api-config';
import { ClipboardList, Clock, FileText, Download, CheckCircle2, Trophy, BarChart3, Save, ShieldCheck, Timer, X } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { Link } from 'react-router-dom';

function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = String(filePath).replace(/^\.\//, '').replace(/^uploads[/\\]/, '');
  return `${getApiOrigin()}/uploads/${clean}`;
}

export default function Assessments() {
  const [activeTab, setActiveTab] = useState('available');
  const [assessments, setAssessments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testsRes = await api.get('/assessments');
        setAssessments(unwrapSchoolList(testsRes));
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        setAssessments([]);
      }

      try {
        const sessionsRes = await api.get('/assessments/sessions');
        setSessions(unwrapSchoolList(sessionsRes));
      } catch (error) {
        console.warn('Failed to fetch assessment history:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assessments</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Practice tests, topic tests, unit tests, subject tests, mock exams, and final exams.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {['Practice', 'Topic', 'Unit', 'Subject', 'Mock', 'Final'].map((label) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{label} Tests</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Available when published.</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Timer className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Real-Time Timer</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <Save className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Auto Save</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Anti-Cheat Monitoring</p>
        </div>
        <div className="rounded-lg border border-violet-100 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Instant Result</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto border-b border-slate-100 pb-px custom-scrollbar dark:border-slate-800">
        <div className="flex gap-6">
          {[
            { id: 'available', label: 'Available Tests' },
            { id: 'history', label: 'Past Results' },
            { id: 'diagnostic', label: 'Diagnostic' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 py-3 text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
               <ClipboardList className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No available tests</h3>
               <p className="mt-1 text-sm text-slate-500">You don't have any pending assessments right now.</p>
             </div>
          ) : (
            assessments.map((test) => {
              const uploadUrl = resolveUploadUrl(test.file_path || test.filePath);
              return (
              <div key={test.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {test.type || test.assessment_type || 'Assessment'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {test.status || 'scheduled'}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {test.title}
                  </h3>
                  
                  <p className="mb-6 text-sm text-slate-500 line-clamp-2">
                    {test.content_text || 'Your teacher has posted this assessment. Open it to view instructions or download the question paper.'}
                  </p>
                  
                  <div className="mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      <span>{test.duration_minutes || test.durationMinutes || 60} mins</span>
                    </div>
                    <div>{test.total_marks || test.totalMarks || 100} marks</div>
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button 
                      onClick={() => setSelectedAssessment(test)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      <FileText size={16} />
                      View Assessment
                    </button>
                    {uploadUrl && (
                      <a
                        href={uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <Download size={16} />
                        Download Paper
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
               <BarChart3 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No past results</h3>
               <p className="mt-1 text-sm text-slate-500">Complete an assessment to see your results here.</p>
             </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                      session.status === 'submitted' || session.status === 'auto_submitted' 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {session.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {session.mockTest?.title || 'Assessment'}
                  </h3>
                  
                  {(session.status === 'submitted' || session.status === 'auto_submitted') && (
                    <div className="mb-6 flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{session.totalScore || 0}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
                        <p className="text-2xl font-black text-blue-600">{session.accuracy || 0}%</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link 
                      to={`/school/student/assessments/${session.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <BarChart3 size={16} />
                      View Analysis
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'diagnostic' && (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-12 text-center shadow-sm dark:border-blue-900/30 dark:from-slate-900 dark:to-slate-900">
          <ClipboardList className="mb-6 h-16 w-16 text-blue-600" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Teacher Assessments</h3>
          <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
            Diagnostic online tests are not enabled for this school assessment flow yet. Teacher-posted assessments appear in Available Tests.
          </p>
        </div>
      )}

      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedAssessment.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {(selectedAssessment.type || 'Assessment')} | {selectedAssessment.total_marks || 100} marks | {selectedAssessment.duration_minutes || 60} mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {selectedAssessment.content_text ? (
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {selectedAssessment.content_text}
                </pre>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                  No text instructions were added. Download the uploaded question paper if available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
