import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Trophy, Plus, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  Loader2, BookOpen, Folder, UploadCloud, FileText, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as competitiveApi from '@/lib/api/competitive';
import type { MasterExam, MasterSubject, MasterChapter, MasterTopic, CompetitiveQuestion } from '@/lib/api/competitive';
import Modal from '@/components/school/admin/Modal';

type Tab = 'taxonomy' | 'train' | 'verify-queue';

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
}

function ConfirmDeleteModal({ state, onClose }: { state: ConfirmState | null; onClose: () => void }) {
  return (
    <Modal isOpen={!!state} title={state?.title ?? ''} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-slate-600">{state?.message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button
            onClick={async () => { await state?.onConfirm(); onClose(); }}
            className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Inline "add" row ───────────────────────────────────────────────────────

function InlineAdd({ placeholder, onSave, onCancel }: { placeholder: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex items-center gap-2 py-1.5">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && val.trim()) onSave(val.trim());
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 h-9 px-3 text-sm bg-white border-2 border-indigo-400 rounded-xl outline-none"
      />
      <button onClick={() => val.trim() && onSave(val.trim())} className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold">Add</button>
      <button onClick={onCancel} className="h-9 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">Cancel</button>
    </div>
  );
}

// ─── Taxonomy tree: Exam -> Subject -> Chapter -> Topic ────────────────────
//
// Each exam owns its own subjects (JEE and NEET don't share a syllabus —
// NEET Biology doesn't exist in JEE, and even "Physics" differs in chapter
// emphasis between the two), so the tree nests subjects under the exam
// they belong to, rather than listing exams and subjects as two unrelated
// flat lists.

function TaxonomyTree() {
  const [exams, setExams] = useState<MasterExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [openExam, setOpenExam] = useState<string | null>(null);
  const [subjectsByExam, setSubjectsByExam] = useState<Record<string, MasterSubject[]>>({});
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [chaptersBySubject, setChaptersBySubject] = useState<Record<string, MasterChapter[]>>({});
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [topicsByChapter, setTopicsByChapter] = useState<Record<string, MasterTopic[]>>({});

  const [addingExam, setAddingExam] = useState(false);
  const [newExamCode, setNewExamCode] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [addingSubjectFor, setAddingSubjectFor] = useState<string | null>(null);
  const [addingChapterFor, setAddingChapterFor] = useState<string | null>(null);
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const loadExams = () => {
    setLoading(true);
    competitiveApi.listMasterExams().then(setExams).catch(() => toast.error('Failed to load exams')).finally(() => setLoading(false));
  };
  useEffect(() => { loadExams(); }, []);

  const reloadSubjectsFor = async (examId: string) => {
    const subjects = await competitiveApi.listMasterSubjects(examId);
    setSubjectsByExam((prev) => ({ ...prev, [examId]: subjects }));
  };

  const toggleExam = async (id: string) => {
    if (openExam === id) { setOpenExam(null); return; }
    setOpenExam(id);
    if (!subjectsByExam[id]) await reloadSubjectsFor(id);
  };

  const toggleExamActive = async (exam: MasterExam) => {
    try { await competitiveApi.updateMasterExam(exam.id, { isActive: !exam.is_active }); loadExams(); }
    catch { toast.error('Failed to update exam'); }
  };

  const handleAddExam = async () => {
    if (!newExamCode.trim() || !newExamName.trim()) { toast.error('Give the exam both a code and a name'); return; }
    try {
      await competitiveApi.createMasterExam({ code: newExamCode.trim(), name: newExamName.trim() });
      setAddingExam(false); setNewExamCode(''); setNewExamName('');
      loadExams();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add exam');
    }
  };

  const handleDeleteExam = (exam: MasterExam) => {
    setConfirmState({
      title: 'Delete exam?',
      message: `Delete "${exam.name}" and every subject/chapter/topic under it? This can't be undone.`,
      onConfirm: async () => {
        try {
          await competitiveApi.deleteMasterExam(exam.id);
          toast.success('Exam deleted');
          loadExams();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to delete exam');
        }
      },
    });
  };

  const toggleSubject = async (id: string) => {
    if (openSubject === id) { setOpenSubject(null); return; }
    setOpenSubject(id);
    if (!chaptersBySubject[id]) {
      const chapters = await competitiveApi.listMasterChapters(id);
      setChaptersBySubject((prev) => ({ ...prev, [id]: chapters }));
    }
  };

  const toggleChapter = async (id: string) => {
    if (openChapter === id) { setOpenChapter(null); return; }
    setOpenChapter(id);
    if (!topicsByChapter[id]) {
      const topics = await competitiveApi.listMasterTopics(id);
      setTopicsByChapter((prev) => ({ ...prev, [id]: topics }));
    }
  };

  const handleAddSubject = async (examId: string, name: string) => {
    try {
      await competitiveApi.createMasterSubject({ examId, name });
      setAddingSubjectFor(null);
      await reloadSubjectsFor(examId);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to add subject'); }
  };

  const handleDeleteSubject = (subject: MasterSubject) => {
    setConfirmState({
      title: 'Delete subject?',
      message: `Delete "${subject.name}" and every chapter/topic under it? This can't be undone.`,
      onConfirm: async () => {
        try {
          await competitiveApi.deleteMasterSubject(subject.id);
          toast.success('Subject deleted');
          await reloadSubjectsFor(subject.exam_id);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to delete subject');
        }
      },
    });
  };

  const handleAddChapter = async (subjectId: string, name: string) => {
    try {
      await competitiveApi.createMasterChapter({ masterSubjectId: subjectId, name });
      setAddingChapterFor(null);
      const chapters = await competitiveApi.listMasterChapters(subjectId);
      setChaptersBySubject((prev) => ({ ...prev, [subjectId]: chapters }));
    } catch { toast.error('Failed to add chapter'); }
  };

  const handleDeleteChapter = (chapter: MasterChapter) => {
    setConfirmState({
      title: 'Delete chapter?',
      message: `Delete "${chapter.name}" and every topic under it? This can't be undone.`,
      onConfirm: async () => {
        try {
          await competitiveApi.deleteMasterChapter(chapter.id);
          toast.success('Chapter deleted');
          const chapters = await competitiveApi.listMasterChapters(chapter.master_subject_id);
          setChaptersBySubject((prev) => ({ ...prev, [chapter.master_subject_id]: chapters }));
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to delete chapter');
        }
      },
    });
  };

  const handleAddTopic = async (chapterId: string, name: string) => {
    try {
      await competitiveApi.createMasterTopic({ masterChapterId: chapterId, name });
      setAddingTopicFor(null);
      const topics = await competitiveApi.listMasterTopics(chapterId);
      setTopicsByChapter((prev) => ({ ...prev, [chapterId]: topics }));
    } catch { toast.error('Failed to add topic'); }
  };

  const handleDeleteTopic = (topic: MasterTopic) => {
    setConfirmState({
      title: 'Delete topic?',
      message: `Delete "${topic.name}"? Any questions already filed under it stay in the bank, just unlinked. This can't be undone.`,
      onConfirm: async () => {
        try {
          await competitiveApi.deleteMasterTopic(topic.id);
          toast.success('Topic deleted');
          const topics = await competitiveApi.listMasterTopics(topic.master_chapter_id);
          setTopicsByChapter((prev) => ({ ...prev, [topic.master_chapter_id]: topics }));
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to delete topic');
        }
      },
    });
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Global Syllabus Taxonomy</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every exam owns its own subjects — JEE and NEET don't share a syllabus, so expand an exam to manage its subjects, chapters and topics.
          </p>
        </div>
        {!addingExam && (
          <button onClick={() => setAddingExam(true)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Exam
          </button>
        )}
      </div>

      {addingExam && (
        <div className="flex items-center gap-2 mb-3">
          <input autoFocus value={newExamName} onChange={(e) => setNewExamName(e.target.value)} placeholder="Display name, e.g. BITSAT" className="flex-1 h-9 px-3 text-sm bg-white border-2 border-indigo-400 rounded-xl outline-none" />
          <input value={newExamCode} onChange={(e) => setNewExamCode(e.target.value)} placeholder="code, e.g. bitsat" className="w-40 h-9 px-3 text-sm bg-white border-2 border-indigo-400 rounded-xl outline-none" />
          <button onClick={handleAddExam} className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold">Add</button>
          <button onClick={() => { setAddingExam(false); setNewExamCode(''); setNewExamName(''); }} className="h-9 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">Cancel</button>
        </div>
      )}

      <div className="space-y-1">
        {exams.map((exam) => (
          <div key={exam.id} className="border border-slate-100 rounded-xl">
            <div className="w-full flex items-center justify-between p-3">
              <button onClick={() => toggleExam(exam.id)} className="flex items-center gap-2 flex-1 text-left">
                {openExam === exam.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                <Trophy className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-800">{exam.name}</span>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">{exam.code}</span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleExamActive(exam)}
                  title={exam.is_active ? 'Click to deactivate' : 'Click to reactivate'}
                  className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-md', exam.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}
                >
                  {exam.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDeleteExam(exam)} title="Delete exam" className="text-slate-300 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {openExam === exam.id && (
              <div className="pl-8 pb-3 pr-3 space-y-1">
                {(subjectsByExam[exam.id] ?? []).map((s) => (
                  <div key={s.id} className="border border-slate-50 rounded-lg">
                    <div className="w-full flex items-center justify-between p-2.5">
                      <button onClick={() => toggleSubject(s.id)} className="flex items-center gap-2 flex-1 text-left">
                        {openSubject === s.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[13px] font-bold text-slate-700">{s.name}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 mr-2">{s.chapter_count ?? 0} chapters</span>
                      <button onClick={() => handleDeleteSubject(s)} title="Delete subject" className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {openSubject === s.id && (
                      <div className="pl-7 pb-2 pr-2 space-y-1">
                        {(chaptersBySubject[s.id] ?? []).map((c) => (
                          <div key={c.id}>
                            <div className="w-full flex items-center justify-between py-1.5">
                              <button onClick={() => toggleChapter(c.id)} className="flex items-center gap-2 flex-1 text-left">
                                {openChapter === c.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                <Folder className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[13px] font-semibold text-slate-700">{c.name}</span>
                              </button>
                              <span className="text-[10px] text-slate-400 mr-2">{c.topic_count ?? 0} topics</span>
                              <button onClick={() => handleDeleteChapter(c)} title="Delete chapter" className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {openChapter === c.id && (
                              <div className="pl-7 space-y-1">
                                {(topicsByChapter[c.id] ?? []).map((t, i) => (
                                  <div key={t.id} className="flex items-center justify-between py-1 group">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-400 w-4 text-right shrink-0">{i + 1}.</span>
                                      <span className="text-[12px] text-slate-600">{t.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-emerald-500">{t.verified_question_count ?? 0} verified Qs</span>
                                      <button onClick={() => handleDeleteTopic(t)} title="Delete topic" className="text-slate-300 hover:text-red-500">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {addingTopicFor === c.id ? (
                                  <InlineAdd placeholder="New topic name" onSave={(n) => handleAddTopic(c.id, n)} onCancel={() => setAddingTopicFor(null)} />
                                ) : (
                                  <button onClick={() => setAddingTopicFor(c.id)} className="text-[11px] font-bold text-indigo-500">+ Add topic</button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {addingChapterFor === s.id ? (
                          <InlineAdd placeholder="New chapter name" onSave={(n) => handleAddChapter(s.id, n)} onCancel={() => setAddingChapterFor(null)} />
                        ) : (
                          <button onClick={() => setAddingChapterFor(s.id)} className="text-[11px] font-bold text-indigo-500">+ Add chapter</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {addingSubjectFor === exam.id ? (
                  <InlineAdd placeholder="New subject name, e.g. Legal Reasoning" onSave={(n) => handleAddSubject(exam.id, n)} onCancel={() => setAddingSubjectFor(null)} />
                ) : (
                  <button onClick={() => setAddingSubjectFor(exam.id)} className="text-[11px] font-bold text-indigo-500">+ Add subject</button>
                )}
              </div>
            )}
          </div>
        ))}
        {exams.length === 0 && !addingExam && (
          <p className="text-sm text-slate-400 py-6 text-center">No exams yet. Add one to start building its syllabus.</p>
        )}
      </div>

      <ConfirmDeleteModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

// ─── Train from PDF ─────────────────────────────────────────────────────────

const RUN_POLL_MS = 2500;

function RunStatusCard({ run }: { run: competitiveApi.IngestRun }) {
  const pct = run.pages_total ? Math.min(100, Math.round((run.pages_done / run.pages_total) * 100)) : null;
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-700 truncate">{run.file_name || 'Untitled'}</p>
        <span className={cn(
          'text-[10px] font-black uppercase px-2 py-0.5 rounded-md',
          run.status === 'running' ? 'bg-indigo-50 text-indigo-600' : run.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
        )}>
          {run.status}
        </span>
      </div>

      {run.status === 'running' && (
        <div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct ?? 8}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {run.pages_total ? `Page ${run.pages_done} of ${run.pages_total}` : 'Starting extraction...'}
            {run.stage ? ` · ${run.stage}` : ''}
          </p>
        </div>
      )}

      {run.status === 'succeeded' && (
        <div>
          <p><span className="font-bold">{run.total_extracted}</span> questions extracted, <span className="font-bold">{run.inserted}</span> added to the verify queue.</p>
          {run.quality === 'low_yield' && <p className="text-amber-600 font-bold mt-1">⚠ Low yield — this file may need a closer look.</p>}
          {run.truncated && <p className="text-amber-600 font-bold mt-1">⚠ One or more batches hit the output limit — consider splitting this file.</p>}
        </div>
      )}

      {run.status === 'failed' && (
        <p className="text-red-600 font-semibold">{run.error_message || 'Extraction failed.'}</p>
      )}
    </div>
  );
}

function TrainFromPdf() {
  const [exams, setExams] = useState<MasterExam[]>([]);
  const [examId, setExamId] = useState('');
  const [subjects, setSubjects] = useState<MasterSubject[]>([]);
  const [masterSubjectId, setMasterSubjectId] = useState('');
  const [examYear, setExamYear] = useState('');
  const [source, setSource] = useState<'pyq' | 'question_bank'>('pyq');
  const [file, setFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<competitiveApi.IngestRun | null>(null);
  const [history, setHistory] = useState<competitiveApi.IngestRun[]>([]);

  useEffect(() => {
    competitiveApi.listMasterExams().then((all) => setExams(all.filter((e) => e.is_active))).catch(() => toast.error('Failed to load exams'));
    loadHistory();
  }, []);

  // Subjects are a child of the exam — reload whenever the chosen exam changes.
  useEffect(() => {
    setMasterSubjectId('');
    if (!examId) { setSubjects([]); return; }
    competitiveApi.listMasterSubjects(examId).then(setSubjects).catch(() => toast.error('Failed to load subjects'));
  }, [examId]);

  const loadHistory = () => {
    competitiveApi.listIngestRuns(10).then(setHistory).catch(() => {});
  };

  // Poll the active run until it leaves the "running" state.
  useEffect(() => {
    if (!activeRun || activeRun.status !== 'running') return;
    const timer = setInterval(async () => {
      try {
        const updated = await competitiveApi.getIngestRunStatus(activeRun.id);
        setActiveRun(updated);
        if (updated.status !== 'running') {
          clearInterval(timer);
          loadHistory();
          if (updated.status === 'succeeded') {
            toast.success(`Extracted ${updated.total_extracted} question(s), ${updated.inserted} added to the verify queue`);
          } else {
            toast.error(updated.error_message || 'Extraction failed');
          }
        }
      } catch {
        // transient — try again on the next tick
      }
    }, RUN_POLL_MS);
    return () => clearInterval(timer);
  }, [activeRun?.id, activeRun?.status]);

  const handleSubmit = async () => {
    if (!file) { toast.error('Choose a PDF to train from'); return; }
    if (!examId) { toast.error('Pick which exam this file belongs to'); return; }
    if (!masterSubjectId) { toast.error('Pick which subject this file belongs to'); return; }
    setSubmitting(true);
    try {
      const { runId } = await competitiveApi.ingestFromPdf({
        file,
        answerKeyFile: answerKeyFile ?? undefined,
        masterSubjectId,
        examYear: examYear ? Number(examYear) : undefined,
        source,
      });
      const run = await competitiveApi.getIngestRunStatus(runId);
      setActiveRun(run);
      toast.success('Extraction started — tracking progress below.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Could not start extraction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-5">
      <div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-1">Train from a PDF</h3>
        <p className="text-xs text-slate-500">
          Upload a PYQ paper or a question-bank PDF. A vision model reads the actual pages — scanned or digital,
          it doesn't matter — and extracts discrete questions. Everything lands in the Verify Queue first; nothing
          reaches a teacher until a human approves it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm">
            <option value="">Select...</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">Not seeing an exam? Add it from the Taxonomy tab.</p>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Exam year (optional)</label>
          <input type="number" value={examYear} onChange={(e) => setExamYear(e.target.value)} placeholder="e.g. 2024" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 mb-1 block">Subject (this whole file belongs to)</label>
        <select value={masterSubjectId} onChange={(e) => setMasterSubjectId(e.target.value)} disabled={!examId} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm disabled:opacity-50">
          <option value="">{examId ? 'Select...' : 'Pick an exam first'}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 mb-1 block">Source type</label>
        <div className="flex gap-2">
          {([['pyq', 'Official PYQ paper'], ['question_bank', 'Coaching question bank']] as [typeof source, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSource(val)}
              className={cn('flex-1 h-10 rounded-xl text-xs font-bold border-2', source === val ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 mb-1 block">Question paper PDF</label>
        <label className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer text-sm text-slate-500 hover:border-indigo-300">
          <UploadCloud className="w-4 h-4" />
          {file ? file.name : 'Choose a PDF...'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 mb-1 block">Answer key PDF (optional, if separate from the paper)</label>
        <label className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer text-sm text-slate-500 hover:border-indigo-300">
          <FileText className="w-4 h-4" />
          {answerKeyFile ? answerKeyFile.name : 'Choose a PDF...'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setAnswerKeyFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || activeRun?.status === 'running'}
        className="w-full h-12 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting || activeRun?.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        {submitting ? 'Starting...' : activeRun?.status === 'running' ? 'Extraction in progress...' : 'Extract Questions'}
      </button>

      {activeRun && <RunStatusCard run={activeRun} />}

      {history.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">Recent runs</h4>
          <div className="space-y-2">
            {history.map((r) => <RunStatusCard key={r.id} run={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Verify queue ───────────────────────────────────────────────────────────

function VerifyQueue() {
  const [queue, setQueue] = useState<CompetitiveQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setQueue(await competitiveApi.listVerifyQueue(50)); }
    catch { toast.error('Failed to load verify queue'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    try { await competitiveApi.verifyQuestion(id, {}); toast.success('Approved'); load(); }
    catch { toast.error('Failed to approve'); }
  };
  const reject = async (id: string) => {
    try { await competitiveApi.rejectQuestion(id); toast.success('Rejected'); load(); }
    catch { toast.error('Failed to reject'); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  if (queue.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center bg-white rounded-2xl border border-slate-200">The verify queue is empty — nothing waiting for review.</p>;
  }

  return (
    <div className="space-y-3">
      {queue.map((q) => (
        <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{q.source}</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{q.exam_target}</span>
            {q.exam_year && <span className="text-[10px] text-slate-400">{q.exam_year}</span>}
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-2">{q.question_text}</p>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {Object.entries(q.options || {}).map(([k, v]) => (
              <span key={k} className={cn('text-xs px-2 py-1 rounded-lg border', k === q.correct_answer ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-100 text-slate-500')}>
                {k}. {v}
              </span>
            ))}
          </div>
          {!q.correct_answer && <p className="text-xs text-amber-600 font-bold mb-2">⚠ No correct answer detected — fix before approving.</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => reject(q.id)} className="h-9 px-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
            <button onClick={() => approve(q.id)} className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CompetitivePrepPage() {
  const [tab, setTab] = useState<Tab>('taxonomy');

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Competitive Exam Prep</h1>
          <p className="text-slate-500 text-sm">Global syllabus taxonomy and question bank — shared across every school that has this feature enabled.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {([
          ['taxonomy', 'Taxonomy'],
          ['train', 'Train from PDF'],
          ['verify-queue', 'Verify Queue'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn('px-4 py-2.5 text-sm font-bold border-b-2 -mb-px', tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'taxonomy' ? <TaxonomyTree /> : tab === 'train' ? <TrainFromPdf /> : <VerifyQueue />}
    </div>
  );
}
