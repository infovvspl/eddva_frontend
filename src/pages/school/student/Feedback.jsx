import React, { useState } from 'react';
import api from '@/lib/api/school-client';
import { MessageSquare, ThumbsUp, Lightbulb, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function Feedback() {
  const [feedback, setFeedback] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    try {
      // Send feedback
      await api.post('/ai/feedback/generate', {
        context: 'student_general_feedback',
        data: { message: feedback }
      });
      setSuccess(true);
      setFeedback('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Could not submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/feedback/generate', {
        context: 'performance_review',
        data: {}
      });
      setGeneratedFeedback(res.data?.feedback || 'You are doing great! Focus on completing your pending assignments.');
    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Feedback & Review
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Get personalized feedback and share your thoughts.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit Feedback */}
        <div className="flex flex-col rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ThumbsUp className="text-emerald-500" /> Share Your Thoughts
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              How can we improve your learning experience?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you like, what you're struggling with, or suggest a new feature..."
              className="mb-6 flex-1 resize-none rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              rows={6}
            />
            
            <button
              type="submit"
              disabled={!feedback.trim() || loading}
              className="mt-auto w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && !generatedFeedback ? 'Submitting...' : 'Submit Feedback'}
            </button>
            
            {success && (
              <p className="mt-3 text-center text-sm font-bold text-emerald-600">
                Thank you! Your feedback has been submitted.
              </p>
            )}
          </form>
        </div>

        {/* Get AI Feedback */}
        <div className="flex flex-col rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:to-slate-900">
          <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-blue-600" /> AI Performance Review
          </h2>
          
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            Get an instant, AI-generated review of your recent performance, including strengths and areas for improvement.
          </p>
          
          {!generatedFeedback ? (
            <button
              onClick={handleGenerateAiFeedback}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing Profile...' : 'Generate Review'}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Performance Insights</h3>
                  <p className="text-xs text-slate-500">Generated just now</p>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                {generatedFeedback}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
