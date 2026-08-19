import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Save, Loader2, ArrowRight, BookOpen, Calendar, HelpCircle, FileText } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function LessonCompletionModal({ open, isOpen, onClose, lesson, onSuccess }) {
  const isVisible = open ?? isOpen;
  // Completion Status: Fully Completed, Partially Completed, Not Completed
  const [completionType, setCompletionType] = useState('FULLY');
  
  // Required Recorded Fields
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualDuration, setActualDuration] = useState(lesson?.periods_allocated || lesson?.duration_periods || 1);
  const [topicsCovered, setTopicsCovered] = useState(lesson?.topic_name || lesson?.topicName || lesson?.chapter_name || '');
  const [learningObjectivesAchieved, setLearningObjectivesAchieved] = useState(lesson?.expected_learning_outcomes || lesson?.learningObjectives || '');
  const [studentUnderstanding, setStudentUnderstanding] = useState('Good');
  const [homeworkAssigned, setHomeworkAssigned] = useState(lesson?.homework || '');
  const [assessmentConducted, setAssessmentConducted] = useState(lesson?.assessment_method || 'Quick Classroom Quiz & Verbal Checking');
  const [teacherReflection, setTeacherReflection] = useState('');
  const [additionalRemarks, setAdditionalRemarks] = useState('');
  
  // Delay & Carry forward details
  const [delayReason, setDelayReason] = useState('');
  const [carryForwardDate, setCarryForwardDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isVisible || !lesson) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/syllabus/lessons/${lesson.id}/complete`, {
        completionType, // FULLY, PARTIALLY, NOT_COMPLETED
        actualDate,
        actualDurationPeriods: actualDuration,
        topicsCovered,
        learningObjectivesAchieved,
        studentUnderstandingRating: studentUnderstanding,
        homeworkAssigned,
        assessmentConducted,
        teacherReflection,
        additionalRemarks,
        delayReason,
        carryForwardDate: completionType !== 'FULLY' ? carryForwardDate : null
      });

      toast.success(
        completionType === 'FULLY' 
          ? 'Lesson recorded as Fully Completed!' 
          : completionType === 'PARTIALLY'
          ? 'Partial completion recorded & pending topic carried forward!'
          : 'Lesson recorded as Not Completed & rescheduled!'
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      toast.error(err.response?.data?.message || 'Failed to record lesson completion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-6 max-h-[90vh] overflow-y-auto font-poppins">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600 text-white">
                {lesson.class_name || lesson.className} ({lesson.section_name || lesson.sectionName})
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {lesson.subject_name || lesson.subjectName}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Record Lesson Execution & Completion</h2>
            <p className="text-xs text-slate-500">Log actual class execution, student understanding, homework, and teacher reflection.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Completion Status Selector (Fully Completed, Partially Completed, Not Completed) */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Lesson Completion Status *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'FULLY', label: 'Fully Completed', sub: 'Entire topic covered as planned', color: 'bg-emerald-600 text-white border-emerald-600' },
                { type: 'PARTIALLY', label: 'Partially Completed', sub: 'Covered part of topic, rest carried forward', color: 'bg-amber-600 text-white border-amber-600' },
                { type: 'NOT_COMPLETED', label: 'Not Completed', sub: 'Class missed or topic needs re-teaching', color: 'bg-rose-600 text-white border-rose-600' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setCompletionType(item.type)}
                  className={`p-4 rounded-2xl text-left transition-all border ${completionType === item.type ? `${item.color} shadow-md` : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                >
                  <p className="text-xs font-black">{item.label}</p>
                  <p className={`text-[10px] mt-0.5 font-semibold ${completionType === item.type ? 'text-white/80' : 'text-slate-400'}`}>{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Actual Date & Actual Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Actual Date Conducted *
              </label>
              <input
                type="date"
                required
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Actual Duration (Periods / Minutes) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={actualDuration}
                  onChange={e => setActualDuration(parseInt(e.target.value) || 1)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Periods</span>
              </div>
            </div>
          </div>

          {/* 3. Topics Covered & 4. Learning Objectives Achieved */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topics Covered *
              </label>
              <textarea
                rows="3"
                required
                value={topicsCovered}
                onChange={e => setTopicsCovered(e.target.value)}
                placeholder="List specific concepts, formulas, or textbook sections taught..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Learning Objectives Achieved *
              </label>
              <textarea
                rows="3"
                required
                value={learningObjectivesAchieved}
                onChange={e => setLearningObjectivesAchieved(e.target.value)}
                placeholder="Key learning outcomes mastered by students..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* 5. Student Understanding & 7. Assessment Conducted */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Understanding Level *
              </label>
              <select
                value={studentUnderstanding}
                onChange={e => setStudentUnderstanding(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Excellent">⭐⭐⭐⭐⭐ Excellent (Students mastered concept effortlessly)</option>
                <option value="Good">⭐⭐⭐⭐ Good (Majority of class understood concepts well)</option>
                <option value="Average">⭐⭐⭐ Average (Mixed response, needs practice exercises)</option>
                <option value="Needs Improvement">⭐⭐ Needs Improvement (Many doubts raised, requires revision)</option>
                <option value="Poor">⭐ Poor (High difficulty, needs re-teaching session)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Conducted
              </label>
              <input
                type="text"
                value={assessmentConducted}
                onChange={e => setAssessmentConducted(e.target.value)}
                placeholder="e.g. 5-min exit quiz, oral questioning, board problem"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* 6. Homework Assigned */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Homework Assigned
            </label>
            <input
              type="text"
              value={homeworkAssigned}
              onChange={e => setHomeworkAssigned(e.target.value)}
              placeholder="e.g. Exercise 1.2 Q1 to Q5 from textbook, worksheet #3"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Carry Forward Details if Partially or Not Completed */}
          {completionType !== 'FULLY' && (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-200">
                <AlertCircle size={16} /> Carry Forward & Delay Details
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">Reason for Partial/Non Completion</label>
                  <input
                    type="text"
                    value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                    placeholder="e.g. Student doubts took longer, Assembly event"
                    className="w-full rounded-2xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">Rescheduled / Carry-Forward Date</label>
                  <input
                    type="date"
                    value={carryForwardDate}
                    onChange={e => setCarryForwardDate(e.target.value)}
                    className="w-full rounded-2xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Teacher Reflection & 9. Additional Remarks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                8. Teacher Reflection
              </label>
              <textarea
                rows="3"
                value={teacherReflection}
                onChange={e => setTeacherReflection(e.target.value)}
                placeholder="Reflection on teaching effectiveness, classroom engagement, or adjustments for next session..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                9. Additional Remarks
              </label>
              <textarea
                rows="3"
                value={additionalRemarks}
                onChange={e => setAdditionalRemarks(e.target.value)}
                placeholder="Any special notes for substitute teacher, lab setup, or follow-up..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
