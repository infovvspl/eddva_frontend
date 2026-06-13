import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { unwrapSchoolData } from '@/lib/api/school-client';
import { ChevronLeft, PlayCircle, FileText, CheckCircle2, MonitorPlay, FileDown, ExternalLink } from 'lucide-react';

export default function TopicDetails() {
  const { batchId, topicId } = useParams();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await api.get(`/students/courses/${batchId}/topics/${topicId}`);
        setTopicData(unwrapSchoolData(res, null));
      } catch (error) {
        console.error('Failed to fetch topic details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopic();
  }, [batchId, topicId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <MonitorPlay className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Topic not found</h2>
        <Link to={`/school/student/classes/${batchId}`} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Back to Course</Link>
      </div>
    );
  }

  const { topic, progress, lectures, resources } = topicData;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link to={`/school/student/classes/${batchId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft size={16} />
          Back to Curriculum
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="rounded-lg bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {topic.subject?.name}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            {topic.chapter?.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{topic.name}</h1>
          {progress.status === 'completed' && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle2 size={18} />
              Completed
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Lectures */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MonitorPlay className="text-blue-600" /> Lectures
            </h2>
            
            {lectures.length === 0 ? (
              <p className="text-sm text-slate-500">No lectures available for this topic yet.</p>
            ) : (
              <div className="space-y-4">
                {lectures.map((lec) => (
                  <div key={lec.id} className="flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                      {lec.thumbnailUrl ? (
                        <img src={lec.thumbnailUrl} alt={lec.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><PlayCircle className="text-slate-400" /></div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 hover:opacity-100 transition-opacity">
                        <button className="rounded-full bg-blue-600 p-2 text-white shadow-lg"><PlayCircle size={24} /></button>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{lec.title}</h3>
                      <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>{Math.floor((lec.durationSeconds || 0)/60)} mins</span>
                        {lec.progress?.isCompleted ? (
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12}/> Watched</span>
                        ) : (
                          <span>{lec.progress?.watchPercentage || 0}% watched</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Resources */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-amber-500" /> Study Materials
            </h2>
            
            {resources.length === 0 ? (
              <p className="text-sm text-slate-500">No resources available.</p>
            ) : (
              <div className="space-y-3">
                {resources.map((res) => (
                  <a 
                    key={res.id} 
                    href={res.fileUrl || res.externalUrl || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-amber-200 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-amber-900/30 dark:hover:bg-amber-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                        <FileText size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{res.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.type}</p>
                      </div>
                    </div>
                    {res.fileUrl ? <FileDown size={16} className="text-slate-400" /> : <ExternalLink size={16} className="text-slate-400" />}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
