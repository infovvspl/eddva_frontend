import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { unwrapSchoolData } from '@/lib/api/school-client';
import { ChevronLeft, BookOpen, PlayCircle, FileText, CheckCircle2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function ClassDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/students/courses/${id}`);
        const data = unwrapSchoolData(res, null);
        setCourse(data);
        if (data?.curriculum?.length > 0) {
          setExpandedSubject(data.curriculum[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <BookOpen className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course not found</h2>
        <Link to="/school/student/classes" className="mt-4 text-sm font-bold text-blue-600 hover:underline">Back to Classes</Link>
      </div>
    );
  }

  const { batch, curriculum, summary } = course;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link to="/school/student/classes" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft size={16} />
          Back to Classes
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="rounded-lg bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {batch.class}
              </span>
              <span className="rounded-lg bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {batch.examTarget}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">{batch.name}</h1>
          </div>
          
          <div className="flex items-center gap-6 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Progress</p>
              <p className="text-2xl font-black text-blue-600">{summary.progressPercent}%</p>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lectures</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{summary.watchedLectures}/{summary.totalLectures}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Curriculum Overview</h2>
        
        {(!curriculum || curriculum.length === 0) ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No curriculum published for your subjects yet.</p>
            <p className="mt-1 text-xs text-slate-500">When your teachers add chapters and topics under Course Content, they will appear here.</p>
          </div>
        ) : curriculum.map(subject => (
          <div key={subject.id} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              className="flex w-full items-center justify-between p-6 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{subject.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">{subject.chapters.length} Chapters - Teacher: {subject.teacher?.name || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {expandedSubject === subject.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
            </button>
            
            {expandedSubject === subject.id && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="space-y-4">
                  {subject.chapters.map(chapter => (
                    <div key={chapter.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{chapter.name}</h4>
                          <p className="text-xs font-semibold text-slate-500">{chapter.topics.length} Topics</p>
                        </div>
                        {expandedChapter === chapter.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>
                      
                      {expandedChapter === chapter.id && (
                        <div className="border-t border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                          {chapter.topics.map(topic => (
                            <Link
                              key={topic.id}
                              to={`/school/student/classes/${batch.id}/topics/${topic.id}`}
                              className="group flex items-center justify-between rounded-xl p-3 transition hover:bg-white dark:hover:bg-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                {topic.progress?.status === 'completed' ? (
                                  <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : topic.progress?.status === 'locked' ? (
                                  <Lock size={18} className="text-slate-300 dark:text-slate-600" />
                                ) : (
                                  <PlayCircle size={18} className="text-blue-500 group-hover:text-blue-600" />
                                )}
                                <span className={cn(
                                  "text-sm font-semibold transition-colors",
                                  topic.progress?.status === 'locked' ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200 group-hover:text-blue-600"
                                )}>
                                  {topic.name}
                                </span>
                              </div>
                              <div className="flex gap-3 text-xs font-semibold text-slate-400">
                                <span className="flex items-center gap-1"><PlayCircle size={14} /> {topic.lectures?.total || 0}</span>
                                <span className="flex items-center gap-1"><FileText size={14} /> {Object.values(topic.resourceCounts || {}).reduce((a,b)=>a+b,0)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
