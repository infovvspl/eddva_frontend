import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Save, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function LessonCompletionModal({ isOpen, onClose, lesson, onSuccess }) {
  const [completionType, setCompletionType] = useState('FULLY');
  const [actualDuration, setActualDuration] = useState(1);
  const [studentUnderstanding, setStudentUnderstanding] = useState(4);
  const [topicsCovered, setTopicsCovered] = useState(lesson?.learningObjectives || '');
  const [reflection, setReflection] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [carryForwardDate, setCarryForwardDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lesson) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/syllabus/lessons/${lesson.id}/complete`, {
        completionType,
        actualDurationPeriods: actualDuration,
        studentUnderstandingRating: studentUnderstanding,
        topicsCovered,
        teacherReflection: reflection,
        delayReason,
        carryForwardDate: completionType !== 'FULLY' ? carryForwardDate : null
      });
      toast.success(completionType === 'FULLY' 
        ? 'Lesson marked as fully completed & topic progress updated!' 
        : 'Partial completion recorded & pending topic carried forward!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      toast.error(err.response?.data?.message || 'Failed to complete lesson');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Record Lesson Completion</h2>
            <p className="text-xs text-slate-500">Log actual class execution, student understanding, and reflection.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Completion Status Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Lesson Completion Status *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'FULLY', label: 'Fully Completed', color: 'bg-emerald-600 text-white' },
                { type: 'PARTIALLY', label: 'Partially Completed', color: 'bg-amber-600 text-white' },
                { type: 'NOT_COMPLETED', label: 'Not Completed', color: 'bg-rose-600 text-white' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setCompletionType(item.type)}
                  className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${completionType === item.type ? `${item.color} border-transparent shadow-md` : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Actual Teaching Periods</label>
              <input
                type="number"
                min="1"
                max="10"
                value={actualDuration}
                onChange={e => setActualDuration(parseInt(e.target.value) || 1)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Understanding Rating (1 - 5 Stars)</label>
              <select
                value={studentUnderstanding}
                onChange={e => setStudentUnderstanding(parseInt(e.target.value) || 4)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent Understanding</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars - Good Understanding</option>
                <option value="3">⭐⭐⭐ 3 Stars - Average / Needs Revision</option>
                <option value="2">⭐⭐ 2 Stars - Low Understanding</option>
                <option value="1">⭐ 1 Star - Concept Needs Re-teaching</option>
              </select>
            </div>
          </div>

          {completionType !== 'FULLY' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800 dark:text-amber-200">
                <AlertCircle size={16} /> Carry Forward & Delay Details
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-amber-800 dark:text-amber-300 mb-1">Reason for Delay / Partial Coverage</label>
                  <input
                    type="text"
                    value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                    placeholder="e.g. Doubts discussion, Event interruption"
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-800 dark:text-amber-300 mb-1">Carry-Forward Date</label>
                  <input
                    type="date"
                    value={carryForwardDate}
                    onChange={e => setCarryForwardDate(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Teacher Reflection & Class Notes</label>
            <textarea
              rows="3"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="What went well? Any student doubts or additional practice needed?"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Submit Lesson Completion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
