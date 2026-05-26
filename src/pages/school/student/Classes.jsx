import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';
import { BookOpen, Calendar, Clock, Video, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/components/school/admin/Skeleton';

export default function Classes() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/students/courses/my');
        setCourses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Classes</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Pick up where you left off or explore your courses.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active classes</h3>
          <p className="mt-1 text-sm text-slate-500">You are not enrolled in any active classes yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.enrollmentId} className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {course.batch?.thumbnailUrl ? (
                  <img src={course.batch.thumbnailUrl} alt={course.batch.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                    <BookOpen className="h-16 w-16 text-white/50" />
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-900 backdrop-blur-md">
                  {course.batch?.examTarget || course.batch?.class || 'Course'}
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex flex-wrap gap-2">
                  {course.subjects?.slice(0, 3).map((sub, i) => (
                    <span key={i} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {sub}
                    </span>
                  ))}
                  {(course.subjects?.length || 0) > 3 && (
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      +{course.subjects.length - 3}
                    </span>
                  )}
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                  {course.batch?.name}
                </h3>
                
                <div className="mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <Video size={14} />
                    <span>{course.progress?.watchedLectures || 0}/{course.progress?.totalLectures || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    <span>{course.progress?.completedTopics || 0}/{course.progress?.totalTopics || 0}</span>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Course Progress</span>
                    <span className="text-blue-600">{course.progress?.overallPct || 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${course.progress?.overallPct || 0}%` }}
                    />
                  </div>
                  
                  <Link 
                    to={`/student/classes/${course.batch?.id}`} 
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-900/20"
                  >
                    View Curriculum
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
