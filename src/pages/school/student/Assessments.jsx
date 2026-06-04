import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';
import { ClipboardList, Clock, BrainCircuit, PlayCircle, CheckCircle2, Trophy, BarChart3, ChevronRight, Save, ShieldCheck, Timer } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { Link, useNavigate } from 'react-router-dom';

export default function Assessments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [mockTests, setMockTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, sessionsRes] = await Promise.all([
          api.get('/assessments/mock-tests?status=published'),
          api.get('/assessments/sessions')
        ]);
        
        setMockTests(testsRes.data.data || []);
        setSessions(sessionsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleStartTest = async (mockTestId) => {
    try {
      const res = await api.post('/assessments/sessions/start', { mockTestId });
      navigate(`/school/student/assessments/${res.data.id}/take`);
    } catch (error) {
      console.error('Failed to start test session:', error);
      alert('Could not start test session. Please try again.');
    }
  };

  const handleGenerateDiagnostic = async () => {
    try {
      const res = await api.post('/assessments/diagnostic/generate');
      navigate(`/school/student/assessments/${res.data.id}/take`);
    } catch (error) {
      console.error('Failed to generate diagnostic test:', error);
      alert('Could not generate diagnostic test. Please try again.');
    }
  };

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
          {mockTests.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
               <ClipboardList className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No available tests</h3>
               <p className="mt-1 text-sm text-slate-500">You don't have any pending assessments right now.</p>
             </div>
          ) : (
            mockTests.map((test) => (
              <div key={test.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {test.type || 'Mock Test'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {test.questions?.length || 0} Questions
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {test.title}
                  </h3>
                  
                  <p className="mb-6 text-sm text-slate-500 line-clamp-2">
                    {test.description || 'Test your understanding of the current topics.'}
                  </p>
                  
                  <div className="mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      <span>{test.durationMinutes} mins</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => handleStartTest(test.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      <PlayCircle size={16} />
                      Start Assessment
                    </button>
                  </div>
                </div>
              </div>
            ))
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
          <BrainCircuit className="mb-6 h-16 w-16 text-blue-600" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">AI Diagnostic Test</h3>
          <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
            Take a personalized diagnostic test generated by our AI to identify your strengths and weak areas across all subjects.
          </p>
          <button 
            onClick={handleGenerateDiagnostic}
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
          >
            <PlayCircle size={20} />
            Generate & Start Test
          </button>
        </div>
      )}
    </div>
  );
}
