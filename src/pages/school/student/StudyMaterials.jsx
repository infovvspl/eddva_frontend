import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  PlayCircle,
  Search,
  Video,
} from 'lucide-react';

const materialTypes = [
  { label: 'Notes', icon: FileText, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  { label: 'PDFs', icon: Download, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'PPTs', icon: BookOpen, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  { label: 'Videos', icon: Video, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  { label: 'Question Banks', icon: ClipboardList, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
];

export default function StudyMaterials() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/students/courses/my');
        setCourses(unwrapSchoolList(res));
      } catch (error) {
        console.error('Failed to fetch study material courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const subjects = useMemo(() => {
    const subjectMap = new Map();
    courses.forEach((course) => {
      const batchId = course.batch?.id || course.batchId;
      (course.subjects || []).forEach((subject) => {
        const name = typeof subject === 'string' ? subject : subject?.name || subject?.subjectName;
        if (!name) return;
        if (!subjectMap.has(name)) {
          subjectMap.set(name, {
            name,
            batchId,
            courseName: course.batch?.name || course.batchName || 'Course',
            progress: course.progress?.overallPct || 0,
          });
        }
      });
    });
    return Array.from(subjectMap.values());
  }, [courses]);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    subject.courseName.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Study Materials</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Notes, PDFs, PPTs, videos, and question banks organized by subject.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Search subjects or courses"
            type="search"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {materialTypes.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">{item.label}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Available inside subject topics.</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Subject Explorer</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Open a subject to access chapters, topics, notes, assignments, tests, and teacher resources.</p>
          </div>
          <BookOpen className="hidden h-6 w-6 text-blue-600 sm:block" />
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No subjects found</h3>
            <p className="mt-1 text-sm text-slate-500">Your enrolled subjects and materials will appear here.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <Link
                key={subject.name}
                to={subject.batchId ? `/school/student/classes/${subject.batchId}` : '/school/student/classes'}
                className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">{subject.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{subject.courseName}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, subject.progress)}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Chapters</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Notes</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Tests</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Offline Notes</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Materials are structured so mobile downloads can support offline revision.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PlayCircle className="h-6 w-6 text-violet-600" />
          <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Resume Watching</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Recorded lessons connect back to progress tracking from My Learning.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="h-6 w-6 text-amber-600" />
          <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Question Banks</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Practice resources stay close to each chapter and topic.</p>
        </div>
      </section>
    </div>
  );
}
