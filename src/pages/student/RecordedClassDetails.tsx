import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { liveBroadcast } from '@/lib/api/live-broadcast';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient, extractData } from '@/lib/api/client';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Loader2,
  PlayCircle,
  Sparkles,
  Tag,
  X,
  MessageCircle,
  Trophy,
  Lock,
  ImagePlus,
  PanelRightClose,
  PanelRightOpen,
  Send,
  HelpCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';

function dateLabel(value: string | Date | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Date pending';
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function timeLabel(value?: string | Date | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
}

function getAvatarColor(name = '') {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function RecordedClassDetails() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('notes');
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Record<string, boolean>>({});
  const [savedResponses, setSavedResponses] = useState<any[]>([]);
  const [resumeAt, setResumeAt] = useState(0);
  const lastSaveTimeRef = useRef(0);
  const notesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [liveNotes, setLiveNotes] = useState('');
  const [liveQuestions, setLiveQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Doubt Panel State
  const [doubtTab, setDoubtTab] = useState<'ai' | 'teacher'>('ai');
  const [doubtText, setDoubtText] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtResponse, setDoubtResponse] = useState<any>(null);
  const [doubtFeedback, setDoubtFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [doubtFeedbackMsg, setDoubtFeedbackMsg] = useState('');
  const [doubtTeacherSent, setDoubtTeacherSent] = useState(false);
  const [doubtErrorMsg, setDoubtErrorMsg] = useState('');
  const [doubtResponseExpanded, setDoubtResponseExpanded] = useState(true);
  const doubtTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!recordingId) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const list = await liveBroadcast.list();
        const found = list.find((item) => item.id === recordingId);
        if (!found) {
          setLoading(false);
          return;
        }

        const rec = await liveBroadcast.getRecordingUrl(recordingId);
        if (rec?.url) {
          setPlaybackUrl(rec.url);
        }

        // Search for matching standard lecture in student lectures
        const lecturesRes = await apiClient.get('/content/lectures').catch(() => null);
        const lecturesList = lecturesRes?.data?.data || lecturesRes?.data || [];
        const matched = lecturesList.find((cl: any) =>
          cl.title.trim().toLowerCase() === found.title.trim().toLowerCase() &&
          (!found.batchId || cl.batchId === found.batchId)
        );

        if (matched) {
          // Fetch full standard lecture details
          const fullLectureRes = await apiClient.get(`/content/lectures/${matched.id}`).catch(() => null);
          const fullLecture = fullLectureRes?.data?.data || fullLectureRes?.data || matched;

          // Fetch checkpoints
          const checkpointsRes = await apiClient.get(`/content/lectures/${matched.id}/quiz-checkpoints`).catch(() => null);
          const cpList = checkpointsRes?.data?.data || checkpointsRes?.data || [];
          setCheckpoints(cpList);

          // Fetch progress
          const progressRes = await apiClient.get(`/content/lectures/${matched.id}/progress`).catch(() => null);
          const progressData = progressRes?.data?.data || progressRes?.data || null;
          if (progressData) {
            setSavedResponses(progressData.quizResponses || []);
            if (progressData.lastPositionSeconds && progressData.lastPositionSeconds > 0) {
              setResumeAt(progressData.lastPositionSeconds);
            }
          }

          setLecture({
            ...fullLecture,
            broadcastId: found.id,
            videoUrl: rec?.url || fullLecture.videoUrl,
          });
        } else {
          setLecture(found);
        }
      } catch (err) {
        console.error('Failed to load recording details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recordingId]);

  const broadcastId = lecture?.broadcastId || recordingId;

  useEffect(() => {
    if (!broadcastId || !lecture) return;
    const key = `coaching_student_notes_${broadcastId}`;
    const saved = localStorage.getItem(key) || '';
    setLiveNotes(saved);

    liveBroadcast.getStudentNotes(broadcastId)
      .then((data) => {
        if (data?.notes) {
          setLiveNotes(data.notes);
          localStorage.setItem(key, data.notes);
        }
      })
      .catch(() => undefined);

    setLoadingQuestions(true);
    liveBroadcast.getQuestions(broadcastId)
      .then((items) => setLiveQuestions(items || []))
      .catch(() => setLiveQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [broadcastId, lecture]);

  const handleLiveNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLiveNotes(value);
    if (!broadcastId) return;
    localStorage.setItem(`coaching_student_notes_${broadcastId}`, value);
    if (notesSaveTimerRef.current) clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      liveBroadcast.saveStudentNotes(broadcastId, value).catch(() => undefined);
    }, 1000);
  };

  const downloadLiveNotes = () => {
    if (!liveNotes.trim()) return;
    const element = document.createElement('a');
    const file = new Blob([liveNotes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${lecture?.title || 'Class'}_LiveNotes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearLiveNotes = () => {
    if (!window.confirm('Are you sure you want to clear your notes?')) return;
    setLiveNotes('');
    if (!broadcastId) return;
    localStorage.removeItem(`coaching_student_notes_${broadcastId}`);
    liveBroadcast.saveStudentNotes(broadcastId, '').catch(() => undefined);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleAskDoubt = async () => {
    if (!doubtText.trim() || doubtLoading || !lecture) return;
    setDoubtLoading(true);
    setDoubtResponse(null);
    setDoubtFeedback(null);
    setDoubtFeedbackMsg('');
    setDoubtTeacherSent(false);
    setDoubtErrorMsg('');
    setDoubtResponseExpanded(true);

    try {
      const res = await apiClient.post('/doubts', {
        questionText: `${doubtText.trim()} (At segment timestamp: ${fmtTime(currentTime)})`,
        subjectId: lecture.subjectId || undefined,
        topicId: lecture.topicId || undefined,
        source: 'lecture',
        sourceRefId: lecture.id,
        skipAI: doubtTab === 'teacher',
      });
      const data = extractData<any>(res);
      if (doubtTab === 'ai') {
        setDoubtResponse({
          id: data.id,
          aiExplanation: data.aiExplanation || "I couldn't generate a clear explanation.",
          aiSteps: data.aiSteps || [],
        });
      } else {
        setDoubtTeacherSent(true);
      }
    } catch (err: any) {
      setDoubtErrorMsg(err?.response?.data?.message || err?.message || 'Failed to submit doubt. Please try again.');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!doubtResponse?.id || doubtFeedback) return;
    setDoubtFeedback(helpful ? 'helpful' : 'not_helpful');
    try {
      await apiClient.patch(`/doubts/${doubtResponse.id}/helpful`, { isHelpful: helpful });
    } catch { /* silent */ }
    if (helpful) {
      setDoubtFeedbackMsg('Marked as helpful — glad it worked!');
    } else {
      setDoubtFeedbackMsg('Forwarded to your teacher for a detailed answer.');
    }
  };

  const handleAnswerSubmitted = async (questionId: string, optionLabel: string) => {
    if (!lecture) return null;
    try {
      const res = await apiClient.post(`/content/lectures/${lecture.id}/quiz-response`, {
        questionId,
        selectedOption: optionLabel,
      });
      const data = extractData<any>(res);
      const newResponse = {
        questionId,
        selectedOption: optionLabel,
        isCorrect: data.isCorrect,
      };
      setSavedResponses(prev => [...prev.filter(r => r.questionId !== questionId), newResponse]);
      return {
        isCorrect: data.isCorrect,
        correctOption: data.correctOption,
        explanation: data.explanation,
      };
    } catch (err) {
      console.error('Failed to submit answer:', err);
      return null;
    }
  };

  const savePlaybackProgress = useCallback(async (seconds: number) => {
    if (!lecture || !lecture.id || lecture.isFallback) return;
    const durationSecs = lecture.videoDurationSeconds || 0;
    const pct = durationSecs > 0 ? Math.min(100, Math.round((seconds / durationSecs) * 100)) : 0;

    try {
      await apiClient.post(`/content/lectures/${lecture.id}/progress`, {
        watchPercentage: pct,
        lastPositionSeconds: Math.round(seconds),
      });
    } catch (err) {
      console.error('Failed to save progress to backend:', err);
    }
  }, [lecture]);

  const handleVideoTimeUpdate = (secs: number) => {
    setCurrentTime(secs);
    const now = Date.now();
    if (now - lastSaveTimeRef.current > 10000) {
      lastSaveTimeRef.current = now;
      savePlaybackProgress(secs);
    }
  };

  const renderVideoPlayer = () => {
    if (!playbackUrl) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 text-center">
          <PlayCircle className="h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-xl font-black text-white">Video is not available</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-350">
            The teacher has not attached a playable recording for this class yet.
          </p>
        </div>
      );
    }

    return (
      <div className="relative">
        <SchoolVideoPlayer
          src={playbackUrl}
          checkpoints={checkpoints}
          autoPlay={true}
          onTimeUpdate={handleVideoTimeUpdate}
          onAnswerSubmitted={handleAnswerSubmitted}
          resumeAt={resumeAt}
        />
      </div>
    );
  };

  const renderStudyPanel = () => {
    if (detailTab === 'my_notes') {
      return (
        <div className="flex min-h-[300px] flex-col space-y-3 font-poppins">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-slate-400">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Digital Notepad
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">Saved to your account</span>
          </div>

          <textarea
            value={liveNotes}
            onChange={handleLiveNotesChange}
            placeholder="Take notes of the lecture here... Write down formulas, questions, or key takeaways."
            className="h-72 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-[13px] font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
          />

          <div className="flex gap-2 rounded-xl border border-slate-200/60 bg-white p-2">
            <button
              type="button"
              onClick={downloadLiveNotes}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-black text-blue-700 transition hover:bg-blue-100/80"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={clearLiveNotes}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-black text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      );
    }

    if (detailTab === 'questions') {
      if (loadingQuestions) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm font-bold text-slate-500">Loading questions...</p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[300px] flex-col space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 font-poppins">
          <div className="flex items-center justify-between px-2 py-1">
            <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-400">Class Q&A</h4>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-black text-blue-700">
              {liveQuestions.length} Questions
            </span>
          </div>

          <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
            {liveQuestions.length === 0 ? (
              <div className="rounded-xl border border-slate-200/50 bg-white p-6 py-12 text-center text-slate-400">
                <HelpCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-500">No questions asked</p>
                <p className="mt-0.5 text-[12px] text-slate-400">No student questions were asked during this class.</p>
              </div>
            ) : (
              [...liveQuestions].reverse().map((q) => (
                <div key={q.id} className="space-y-2.5 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold uppercase text-white shadow-sm"
                        style={{ backgroundColor: getAvatarColor(q.userName) }}
                      >
                        {q.userName ? q.userName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-slate-800">{q.userName}</span>
                        <span className="text-[12px] font-semibold text-slate-400">{timeLabel(q.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                      q.answer ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {q.answer ? 'Answered' : 'Unanswered'}
                    </span>
                  </div>

                  <p className="break-words pl-9 text-[13px] font-semibold leading-relaxed text-slate-700">{q.text}</p>

                  {q.answer && (
                    <div className="ml-9 space-y-1 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <span className="block text-[12px] font-black text-blue-600">Teacher's Answer:</span>
                      <p className="text-[13px] font-semibold leading-relaxed text-slate-700">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (detailTab === 'notes') {
      if (lecture?.aiNotesMarkdown) {
        const imageCount = Array.isArray(lecture.aiNoteImages) ? lecture.aiNoteImages.length : 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {imageCount > 0 ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <ImagePlus size={11} />
                    </span>
                    <span className="font-semibold text-slate-700">{imageCount} visual{imageCount !== 1 ? 's' : ''} embedded</span>
                    <span>· scroll down to see them</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-slate-400">
                      <ImagePlus size={11} />
                    </span>
                    <span>No visuals yet</span>
                  </>
                )}
              </div>
            </div>

            <div className="relative font-poppins">
              <MarkdownRenderer content={lecture.aiNotesMarkdown} className="prose-slate" />
            </div>
          </div>
        );
      }

      if (['pending', 'processing'].includes(lecture?.transcriptStatus)) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">AI notes are being prepared</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              The system is still generating structured notes for this lecture.
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <Sparkles className="h-10 w-10 text-slate-350" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">Notes not ready yet</h3>
          <p className="mt-1 max-w-md text-sm text-slate-550">
            This lecture does not have published AI notes yet.
          </p>
        </div>
      );
    }

    if (detailTab === 'transcript') {
      if (lecture?.transcript) {
        return (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 font-poppins">
            <p className="whitespace-pre-wrap">{lecture.transcript}</p>
          </div>
        );
      }

      if (['pending', 'processing'].includes(lecture?.transcriptStatus)) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript is being generated</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Speech-to-text is still running. Please check back shortly.
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <FileText className="h-10 w-10 text-slate-350" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">Transcript not available</h3>
          <p className="mt-1 max-w-md text-sm text-slate-550">
            This lecture does not have a transcript yet.
          </p>
        </div>
      );
    }

    if (detailTab === 'quiz') {
      const correct = savedResponses.filter(r => r.isCorrect).length;

      return (
        <div className="space-y-4 text-slate-800">
          {savedResponses.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</p>
                <p className="text-base font-black">
                  {correct}/{savedResponses.length}
                  <span className="text-indigo-400 ml-1.5 text-sm">
                    {Math.round((correct / Math.max(savedResponses.length, 1)) * 100)}%
                  </span>
                </p>
              </div>
            </div>
          )}
          {checkpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-8 w-8 text-slate-200 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No quiz checkpoints yet</p>
            </div>
          ) : (
            checkpoints.map((cp, i) => {
              const response = savedResponses.find(r => r.questionId === cp.id);
              const hasAnswered = !!response;
              const isExpanded = !!expandedQuizIds[cp.id];
              if (!hasAnswered) {
                return (
                  <div
                    key={cp.id}
                    className="p-4 rounded-2xl border bg-white border-slate-100 transition-all font-poppins"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 bg-slate-100 text-slate-400">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {cp.segmentTitle && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {cp.segmentTitle}
                          </p>
                        )}
                        <div className="text-sm font-bold text-slate-800 leading-snug">
                          <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                        </div>
                        <span className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-350">
                          <Lock className="w-3.5 h-3.5 text-slate-300" /> Not answered yet
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cp.id}
                  onClick={() => {
                    setExpandedQuizIds((prev) => ({
                      ...prev,
                      [cp.id]: !prev[cp.id],
                    }));
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm select-none font-poppins ${
                    response.isCorrect
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        response.isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {cp.segmentTitle && (
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          response.isCorrect ? "text-emerald-500/80" : "text-rose-500/80"
                        }`}>
                          {cp.segmentTitle}
                        </p>
                      )}
                      <div className="text-sm font-bold text-slate-800 leading-snug">
                        <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-2">
                            {(cp.options || []).map((opt: any) => {
                              const isSelected = response.selectedOption === opt.label;
                              const isCorrectOption = cp.correctOption === opt.label;
                              
                              return (
                                <div
                                  key={opt.label}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold ${
                                    isCorrectOption
                                      ? "border-emerald-250 bg-emerald-500/10 text-emerald-800"
                                      : isSelected
                                      ? "border-rose-250 bg-rose-500/10 text-rose-800"
                                      : "border-slate-100 bg-slate-50/50 text-slate-500"
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${
                                      isCorrectOption
                                        ? "bg-emerald-500 text-white"
                                        : isSelected
                                        ? "bg-rose-500 text-white"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <div className="flex-1 font-medium pointer-events-none">
                                    <MarkdownRenderer content={opt.text} className="prose-p:my-0 text-slate-700 font-semibold" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {cp.explanation && (
                            <div className="p-3 bg-white/60 rounded-xl border border-slate-200/60 text-xs text-slate-500 leading-relaxed">
                              <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Explanation
                              </p>
                              <MarkdownRenderer content={cp.explanation} className="prose-p:my-0 text-slate-500" />
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <div className={`w-1.5 h-1.5 rounded-full ${response.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <span className={response.isCorrect ? "text-emerald-700" : "text-rose-600"}>
                              You answered Option {response.selectedOption}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (detailTab === 'doubt') {
      return (
        <div className="flex flex-col gap-0 text-slate-800">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
              <Clock3 className="w-3 h-3 shrink-0" />
              {fmtTime(currentTime)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full max-w-[180px]">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">{lecture?.subjectName || "General"}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-4 gap-1">
            {(['ai', 'teacher'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setDoubtTab(t); setDoubtResponse(null); setDoubtTeacherSent(false); }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  doubtTab === t
                    ? t === 'ai'
                      ? 'bg-white text-violet-700 shadow-sm border border-violet-100'
                      : 'bg-white text-blue-700 shadow-sm border border-blue-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'ai' ? <Sparkles className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                {t === 'ai' ? 'Ask AI' : 'Ask Teacher'}
              </button>
            ))}
          </div>

          <div className="relative mb-3">
            <textarea
              ref={doubtTextareaRef}
              value={doubtText}
              onChange={e => setDoubtText(e.target.value)}
              placeholder={
                doubtTab === 'ai'
                  ? "What part of the lecture isn't clear? Be specific for a better answer…"
                  : "Describe your doubt in detail so your teacher can help…"
              }
              rows={4}
              className={`w-full resize-none rounded-xl border text-sm p-3 pr-10 leading-relaxed bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:ring-2 ${
                doubtTab === 'ai'
                  ? 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'
                  : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
              }`}
            />
          </div>

          <button
            onClick={handleAskDoubt}
            disabled={!doubtText.trim() || doubtLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all ${
              doubtTab === 'ai'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-200'
            } ${(!doubtText.trim() || doubtLoading) && 'opacity-50 cursor-not-allowed shadow-none'}`}
          >
            {doubtLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {doubtTab === 'ai' ? 'Thinking…' : 'Sending…'}
              </>
            ) : (
              <>
                {doubtTab === 'ai' ? <Sparkles className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {doubtTab === 'ai' ? 'Get AI Answer' : 'Send to Teacher'}
              </>
            )}
          </button>

          {doubtErrorMsg && (
            <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {doubtErrorMsg}
            </p>
          )}

          {doubtResponse && doubtTab === 'ai' && (
            <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/60 to-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-bold text-violet-800">AI Answer</span>
                </div>
                <button
                  onClick={() => setDoubtResponseExpanded(v => !v)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {doubtResponseExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
              {doubtResponseExpanded && (
                <div className="p-4 text-slate-700 text-sm leading-relaxed">
                  <MarkdownRenderer content={doubtResponse.aiExplanation} />
                  <div className="flex items-center gap-2 pt-3 border-t border-violet-100 mt-3">
                    <span className="text-[11px] text-slate-400 font-medium">Was this helpful?</span>
                    <button
                      onClick={() => handleFeedback(true)}
                      disabled={!!doubtFeedback}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        doubtFeedback === 'helpful'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      disabled={!!doubtFeedback}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        doubtFeedback === 'not_helpful'
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> No
                    </button>
                    {doubtFeedbackMsg && (
                      <span className="text-[11px] font-semibold text-slate-500 ml-1">{doubtFeedbackMsg}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {doubtTeacherSent && doubtTab === 'teacher' && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white p-5 text-center">
              <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-blue-800 mb-1">Doubt sent successfully!</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your teacher will review and respond soon. You'll get notified in the dashboard when they reply.
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="space-y-6 p-6">
        <Link
          to="/student/live-classes"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Live Classes
        </Link>
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Lecture not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            This live recording is not available right now or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 -mb-3 min-h-[calc(100vh-76px)] bg-slate-50 sm:-mx-5 sm:-mb-5 lg:-mx-6 lg:-mb-6">
      <div className="border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex w-full items-center gap-3">
          <Link
            to="/student/live-classes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-600 hover:text-white"
            aria-label="Back to live classes"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-blue-600">
              {lecture.subjectName || 'Recorded Class'}
            </p>
            <h1 className="truncate text-sm font-black leading-tight text-slate-900">{lecture.title}</h1>
          </div>
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            aria-label={isSidebarExpanded ? 'Hide AI Notes Panel' : 'Show AI Notes Panel'}
          >
            {isSidebarExpanded ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>{isSidebarExpanded ? 'Hide Panel' : 'Show Panel'}</span>
          </button>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className={`grid gap-6 transition-all duration-300 ${isSidebarExpanded ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
          <main className="min-w-0 space-y-4">
            {renderVideoPlayer()}

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {lecture.subjectName && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                        {lecture.subjectName}
                      </span>
                    )}
                    {lecture.batchName && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                        {lecture.batchName}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{lecture.title}</h2>
                  {lecture.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{lecture.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <CalendarDays size={13} />
                  {dateLabel(lecture.endedAt || lecture.startedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Clock3 size={13} />
                  {lecture.durationSeconds
                    ? `${Math.round(lecture.durationSeconds / 60)} mins`
                    : 'Duration pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Tag size={13} />
                  {lecture.subjectName || 'General topic'}
                </span>
              </div>
            </section>
          </main>

          <aside className={`min-w-0 ${isSidebarExpanded ? 'block' : 'hidden lg:hidden'}`}>
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="grid grid-cols-3 border-b border-slate-100 sm:grid-cols-6">
                <button
                  type="button"
                  onClick={() => setDetailTab('notes')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'notes'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <BookOpen size={13} />
                  AI Notes
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('transcript')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'transcript'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <FileText size={13} />
                  Transcript
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('my_notes')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'my_notes'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <FileText size={13} />
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('questions')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'questions'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <HelpCircle size={13} />
                  Q&A
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('quiz')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'quiz'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Sparkles size={13} />
                  Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('doubt')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'doubt'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <MessageCircle size={13} />
                  Doubt
                </button>
              </div>
              <div className="p-5">{renderStudyPanel()}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

interface GraduationCapProps extends React.SVGProps<SVGSVGElement> {}

function GraduationCap(props: GraduationCapProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.91a2 2 0 0 0 1.66 0z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
