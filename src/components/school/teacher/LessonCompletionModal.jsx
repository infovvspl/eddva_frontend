import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Save, Loader2, ArrowRight, BookOpen, Calendar, HelpCircle, FileText } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <Dialog open={isVisible} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-6 font-poppins">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800 text-left">
          <div className="flex items-center gap-2 pr-6">
            <Badge className="px-3 py-1 text-xs font-black uppercase bg-blue-600 text-white hover:bg-blue-600">
              {lesson.class_name || lesson.className} ({lesson.section_name || lesson.sectionName})
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs font-extrabold uppercase bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
              {lesson.subject_name || lesson.subjectName}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-normal leading-normal">Record Lesson Execution & Completion</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">Log actual class execution, student understanding, homework, and teacher reflection.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Completion Status Selector (Fully Completed, Partially Completed, Not Completed) */}
          <div className="space-y-2">
            <Label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Lesson Completion Status *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'FULLY', label: 'Fully Completed', sub: 'Entire topic covered as planned', color: 'bg-emerald-600 text-white border-emerald-600', hover: 'hover:bg-emerald-600 hover:text-white' },
                { type: 'PARTIALLY', label: 'Partially Completed', sub: 'Covered part of topic, rest carried forward', color: 'bg-amber-600 text-white border-amber-600', hover: 'hover:bg-amber-600 hover:text-white' },
                { type: 'NOT_COMPLETED', label: 'Not Completed', sub: 'Class missed or topic needs re-teaching', color: 'bg-rose-600 text-white border-rose-600', hover: 'hover:bg-rose-600 hover:text-white' }
              ].map(item => (
                <Button
                  key={item.type}
                  type="button"
                  variant="ghost"
                  onClick={() => setCompletionType(item.type)}
                  className={`h-auto p-4 rounded-2xl flex-col items-start justify-start whitespace-normal text-left transition-all border ${completionType === item.type ? `${item.color} ${item.hover} shadow-md` : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                >
                  <p className="text-xs font-black">{item.label}</p>
                  <p className={`text-[10px] mt-0.5 font-semibold ${completionType === item.type ? 'text-white/80' : 'text-slate-400'}`}>{item.sub}</p>
                </Button>
              ))}
            </div>
          </div>

          {/* 2. Actual Date & Actual Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Actual Date Conducted *
              </Label>
              <Input
                type="date"
                required
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Actual Duration (Periods / Minutes) *
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={actualDuration}
                  onChange={e => setActualDuration(parseInt(e.target.value) || 1)}
                  className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Periods</span>
              </div>
            </div>
          </div>

          {/* 3. Topics Covered & 4. Learning Objectives Achieved */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topics Covered *
              </Label>
              <Textarea
                rows="3"
                required
                value={topicsCovered}
                onChange={e => setTopicsCovered(e.target.value)}
                placeholder="List specific concepts, formulas, or textbook sections taught..."
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Learning Objectives Achieved *
              </Label>
              <Textarea
                rows="3"
                required
                value={learningObjectivesAchieved}
                onChange={e => setLearningObjectivesAchieved(e.target.value)}
                placeholder="Key learning outcomes mastered by students..."
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* 5. Student Understanding & 7. Assessment Conducted */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Understanding Level *
              </Label>
              <Select value={studentUnderstanding} onValueChange={setStudentUnderstanding}>
                <SelectTrigger className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent" className="text-xs font-semibold">⭐⭐⭐⭐⭐ Excellent (Students mastered concept effortlessly)</SelectItem>
                  <SelectItem value="Good" className="text-xs font-semibold">⭐⭐⭐⭐ Good (Majority of class understood concepts well)</SelectItem>
                  <SelectItem value="Average" className="text-xs font-semibold">⭐⭐⭐ Average (Mixed response, needs practice exercises)</SelectItem>
                  <SelectItem value="Needs Improvement" className="text-xs font-semibold">⭐⭐ Needs Improvement (Many doubts raised, requires revision)</SelectItem>
                  <SelectItem value="Poor" className="text-xs font-semibold">⭐ Poor (High difficulty, needs re-teaching session)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Conducted
              </Label>
              <Input
                type="text"
                value={assessmentConducted}
                onChange={e => setAssessmentConducted(e.target.value)}
                placeholder="e.g. 5-min exit quiz, oral questioning, board problem"
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* 6. Homework Assigned */}
          <div>
            <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Homework Assigned
            </Label>
            <Input
              type="text"
              value={homeworkAssigned}
              onChange={e => setHomeworkAssigned(e.target.value)}
              placeholder="e.g. Exercise 1.2 Q1 to Q5 from textbook, worksheet #3"
              className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
                  <Label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">Reason for Partial/Non Completion</Label>
                  <Input
                    type="text"
                    value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                    placeholder="e.g. Student doubts took longer, Assembly event"
                    className="h-auto w-full rounded-2xl border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">Rescheduled / Carry-Forward Date</Label>
                  <Input
                    type="date"
                    value={carryForwardDate}
                    onChange={e => setCarryForwardDate(e.target.value)}
                    className="h-auto w-full rounded-2xl border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Teacher Reflection & 9. Additional Remarks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                8. Teacher Reflection
              </Label>
              <Textarea
                rows="3"
                value={teacherReflection}
                onChange={e => setTeacherReflection(e.target.value)}
                placeholder="Reflection on teaching effectiveness, classroom engagement, or adjustments for next session..."
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                9. Additional Remarks
              </Label>
              <Textarea
                rows="3"
                value={additionalRemarks}
                onChange={e => setAdditionalRemarks(e.target.value)}
                placeholder="Any special notes for substitute teacher, lab setup, or follow-up..."
                className="h-auto w-full rounded-2xl border-slate-200 px-4 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs font-bold px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Submit Lesson Completion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
