import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Monitor, ArrowRight, Layers, Zap } from "lucide-react";
import { useMyCourses } from "@/hooks/use-student";
import type { MyCourse } from "@/lib/api/student";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function examBadgeColor(target?: string) {
  if (!target) return "#94a3b8";
  const t = target.toLowerCase();
  if (t.includes("jee")) return "#3b82f6";
  if (t.includes("neet")) return "#10b981";
  return "#a855f7";
}

function CourseCard({ course }: { course: MyCourse }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = React.useState(false);
  const thumb = resolveUrl(course.thumbnailUrl);
  const badgeColor = examBadgeColor(course.examTarget);
  const pct = course.progress?.overallPct ?? 0;

  return (
    <CardGlass onClick={() => navigate(`/student/courses/${course.id}`)} className="p-0 group border-white bg-white/60 shadow-3xl">
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {thumb && !imgError ? (
          <img src={thumb} alt={course.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-950"><GraduationCap className="w-16 h-16 text-white/10" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {course.examTarget && (
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg text-white" style={{ background: badgeColor }}>{course.examTarget}</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
           <div className="flex justify-between items-end mb-2">
              <div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Syllabus Propagation</p>
                 <p className="text-xl font-black text-white italic leading-none">{pct}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"><Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /></div>
           </div>
           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
              <motion.div className="h-full rounded-full shadow-lg" style={{ background: "linear-gradient(90deg, #6366f1, #a855f7)" }} initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1 }} />
           </div>
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-xl font-black text-slate-900 truncate mb-2 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{course.name}</h3>
        {course.teacher && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Lead Node: {course.teacher.name}</p>
        )}
        {course.progress && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-inner">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Topics</p>
               <p className="text-base font-black text-slate-900">{course.progress.completedTopics}/{course.progress.totalTopics}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-inner">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Feeds</p>
               <p className="text-base font-black text-slate-900">{course.progress.completedLectures}/{course.progress.totalLectures}</p>
            </div>
          </div>
        )}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sync Active</span>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><ArrowRight className="w-6 h-6" /></div>
        </div>
      </div>
    </CardGlass>
  );
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading, isError } = useMyCourses();

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center gap-6">
       <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Monitor className="w-8 h-8 animate-spin text-indigo-600" /></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Directory</p>
    </div>
  );

  if (isError) return (
    <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><Monitor className="w-10 h-10 text-slate-200" /></div>
      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Nexus Disconnected</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">Course propagation failure. Verification check failed for this frequency.</p>
    </div>
  );

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
          <div className="space-y-4">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white text-gray-900 w-fit shadow-xl">
               <Monitor className="w-3.5 h-3.5 text-indigo-500" />
               <span className="text-[9px] font-black uppercase tracking-widest">Course Nexus v2.0</span>
             </motion.div>
             <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
               My<br/><span className="not-italic text-indigo-600">Courses</span>
             </h1>
          </div>
          {courses.length > 0 && (
             <CardGlass className="px-10 py-6 border-white bg-white/60 flex items-center gap-6 shadow-3xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg text-xl font-black italic">{courses.length}</div>
                <div>
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Enrolled Nodes</p>
                   <p className="text-2xl font-black text-slate-900 leading-none uppercase italic">Archive Active</p>
                </div>
             </CardGlass>
          )}
        </header>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center max-w-md mx-auto">
            <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><GraduationCap className="w-10 h-10 text-slate-200" /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">No Sector Access</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">You are not currently synced with any curriculum nodes. Enroll in a module to activate this directory.</p>
            <button onClick={() => navigate("/")} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Browse Modules <ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {courses.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.08, type: "spring" }}><CourseCard course={c} /></motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
