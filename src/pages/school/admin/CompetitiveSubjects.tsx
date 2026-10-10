import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trophy, Plus, Users, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api/school-client';
import * as competitiveApi from '@/lib/api/competitive';
import type { CompetitiveSubject, CompetitiveTeacherAssignment, MasterSubject } from '@/lib/api/competitive';
import Modal from '@/components/school/admin/Modal';
import { handleApiError } from '@/lib/school/errorHandler';

interface SchoolClassOption { id: string; name: string; }
interface TeacherOption { id: string; name: string; }

export default function CompetitiveSubjects() {
  const [subjects, setSubjects] = useState<CompetitiveSubject[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<MasterSubject[]>([]);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, CompetitiveTeacherAssignment[]>>({});

  const [form, setForm] = useState({ masterSubjectId: '', classId: '', displayName: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [subjRes, masterRes, classRes, teacherRes] = await Promise.all([
        competitiveApi.listCompetitiveSubjects(),
        competitiveApi.listMasterSubjects(),
        api.get('/academic/classes'),
        api.get('/teachers', { params: { limit: 500 } }),
      ]);
      setSubjects(subjRes);
      setMasterSubjects(masterRes.filter((m) => m.is_active));
      setClasses(classRes.data?.data ?? classRes.data ?? []);
      setTeachers((teacherRes.data?.data ?? teacherRes.data ?? []).map((t: any) => ({ id: t.id, name: t.name })));
    } catch (err) {
      handleApiError(err, 'Failed to load competitive subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!assignments[id]) {
      const rows = await competitiveApi.listAssignmentsForSubject(id);
      setAssignments((prev) => ({ ...prev, [id]: rows }));
    }
  };

  const handleCreate = async () => {
    if (!form.masterSubjectId || !form.classId) {
      toast.error('Pick a subject and a class');
      return;
    }
    try {
      await competitiveApi.createCompetitiveSubject(form);
      toast.success('Competitive subject added');
      setShowCreate(false);
      setForm({ masterSubjectId: '', classId: '', displayName: '' });
      loadAll();
    } catch (err) {
      handleApiError(err, 'Failed to create competitive subject');
    }
  };

  const [assignTeacherId, setAssignTeacherId] = useState('');
  const handleAssign = async (subjectId: string) => {
    if (!assignTeacherId) return;
    try {
      await competitiveApi.assignTeacher(subjectId, { teacherId: assignTeacherId });
      toast.success('Teacher assigned');
      setAssignTeacherId('');
      const rows = await competitiveApi.listAssignmentsForSubject(subjectId);
      setAssignments((prev) => ({ ...prev, [subjectId]: rows }));
      loadAll();
    } catch (err) {
      handleApiError(err, 'Failed to assign teacher');
    }
  };

  const handleUnassign = async (subjectId: string, assignmentId: string) => {
    try {
      await competitiveApi.unassignTeacher(subjectId, assignmentId);
      const rows = await competitiveApi.listAssignmentsForSubject(subjectId);
      setAssignments((prev) => ({ ...prev, [subjectId]: rows }));
      loadAll();
    } catch (err) {
      handleApiError(err, 'Failed to remove assignment');
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Competitive Exam Prep</h1>
            <p className="text-slate-500 text-sm">Offer JEE/NEET-style practice for your classes and assign a teacher to generate content.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Offer a subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
          No competitive subjects yet. Click "Offer a subject" to pick one from the global syllabus and assign it to a class.
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200">
              <button onClick={() => toggleExpand(s.id)} className="w-full flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  {expanded === s.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{s.display_name || s.master_subject_name} — {s.class_name}</p>
                    <p className="text-xs text-slate-400">{s.master_subject_name} · {s.exam_name}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Users className="w-3.5 h-3.5" /> {s.teacher_count} teacher(s)</span>
              </button>

              {expanded === s.id && (
                <div className="border-t border-slate-100 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm">
                      <option value="">Select a teacher to assign...</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={() => handleAssign(s.id)} className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold">Assign</button>
                  </div>

                  <div className="space-y-1.5">
                    {(assignments[s.id] ?? []).map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                        <span className="text-sm font-semibold text-slate-700">{a.teacher_name} <span className="text-xs text-slate-400">({a.teacher_email})</span></span>
                        <button onClick={() => handleUnassign(s.id, a.id)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(assignments[s.id] ?? []).length === 0 && <p className="text-xs text-slate-400 py-2">No teacher assigned yet.</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} title="Offer a competitive subject" onClose={() => setShowCreate(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Subject (from global syllabus)</label>
            <select value={form.masterSubjectId} onChange={(e) => setForm({ ...form, masterSubjectId: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm">
              <option value="">Select...</option>
              {masterSubjects.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.exam_name})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Class</label>
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm">
              <option value="">Select...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Display name (optional)</label>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="e.g. JEE Physics — Class 11" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-xl text-sm font-bold text-slate-500">Cancel</button>
            <button onClick={handleCreate} className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-bold">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
