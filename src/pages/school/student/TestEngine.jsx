import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function TestEngine() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/assessments/sessions/${id}`);
        const sessionData = res.data;
        
        if (sessionData.status === 'submitted' || sessionData.status === 'auto_submitted') {
          navigate(`/school/student/assessments`);
          return;
        }

        setSession(sessionData);
        // Assuming session.mockTest.questions is populated
        setQuestions(sessionData.mockTest?.questions || []);
        
        // Initialize answers from past attempts if any
        const initialAnswers = {};
        if (sessionData.attempts) {
          sessionData.attempts.forEach(attempt => {
            initialAnswers[attempt.questionId] = attempt.selectedOptionId;
          });
        }
        setAnswers(initialAnswers);
        
        // Calculate remaining time
        if (sessionData.startedAt && sessionData.mockTest?.durationMinutes) {
          const startedAt = new Date(sessionData.startedAt).getTime();
          const now = new Date().getTime();
          const durationMs = sessionData.mockTest.durationMinutes * 60 * 1000;
          const remaining = Math.max(0, Math.floor((startedAt + durationMs - now) / 1000));
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error('Failed to fetch test session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, [id, navigate]);

  // Anti-cheat: Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && session && !isSubmitting) {
        setWarnings(w => {
          const newWarnings = w + 1;
          if (newWarnings >= 3) {
            // Auto submit if too many warnings
            handleSubmit(true);
          } else {
            alert(`Warning ${newWarnings}/3: Please do not switch tabs during the test. Your test will be auto-submitted if you leave again.`);
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, isSubmitting]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && session && !isSubmitting) {
      handleSubmit(true);
      return;
    }
    
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [timeLeft, session, isSubmitting]);

  const handleAnswerSelect = async (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    // Save answer to backend
    try {
      await api.post(`/assessments/sessions/${id}/answer`, {
        questionId,
        selectedOptionId: optionId,
        timeSpentSeconds: 15 // Mock time spent
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = useCallback(async (isAuto = false) => {
    if (isSubmitting) return;
    if (!isAuto && !window.confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/assessments/sessions/${id}/submit`);
      navigate('/school/student/assessments');
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Failed to submit test. Please try again.');
      setIsSubmitting(false);
    }
  }, [id, navigate, isSubmitting]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-bold text-slate-500">Preparing your test environment...</p>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-center dark:bg-slate-950">
        <AlertTriangle className="mb-4 h-16 w-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Test Session</h2>
        <button onClick={() => navigate('/school/student/assessments')} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
          Go Back
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white">{session.mockTest?.title}</h1>
            <p className="text-[10px] font-bold text-slate-500">Do not refresh or leave this page.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Remaining</p>
            <p className={cn("text-xl font-black font-mono", timeLeft < 300 ? "text-rose-600 animate-pulse" : "text-slate-900 dark:text-white")}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Finish Test'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                +4 Marks
              </span>
            </div>
            
            <h2 className="mb-8 text-xl font-medium leading-relaxed text-slate-900 dark:text-white" dangerouslySetInnerHTML={{ __html: currentQ?.content }} />
            
            <div className="space-y-4">
              {currentQ?.options?.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswerSelect(currentQ.id, opt.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                      isSelected 
                        ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20" 
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"
                    )} dangerouslySetInnerHTML={{ __html: opt.content }} />
                  </button>
                );
              })}
            </div>
            
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>
        
        {/* Right Sidebar - Questions Palette */}
        <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white p-6 md:block dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Question Palette</h3>
            <span className="text-xs font-bold text-slate-500">{answeredCount}/{questions.length} Answered</span>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = currentIdx === i;
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all",
                    isCurrent ? "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900" : "",
                    isAnswered 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-emerald-100 dark:bg-emerald-900/30" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Not Answered</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
