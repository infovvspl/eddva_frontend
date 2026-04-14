import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, BookOpen, Video, CheckCircle2,
  Circle, Clock, GraduationCap, ArrowLeft, TrendingUp,
  Monitor, Zap, Layers, Target, Info, ArrowRight, Sparkles
} from "lucide-react";
import { useCourseCurriculum } from "@/hooks/use-student";
import type { CourseSubject, CourseChapter, CourseTopic } from "@/lib/api/student";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE = "#2563EB";

function statusIcon(t: CourseTopic) {
  if (t.completedAt) return <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />;
  if ((t.progressPct ?? 0) > 0) return <Clock className="w-5 h-5 shrink-0 text-blue-500" />;
  return <Circle className="w-5 h-5 shrink-0 text-slate-200" />;
}

function TopicRow({ topic, batchId }: { topic: CourseTopic; batchId: string }) {
  const navigate = useNavigate();
  const done = !!topic.completedAt;
  const pct = topic.progressPct ?? 0;
  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 8 }}
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white hover:bg-white/60 hover:shadow-xl group",
        done && "opacity-70"
      )}
      onClick={() => navigate(`/student/courses/${batchId}/topics/${topic.id}`)}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", done ? "bg-emerald-50" : pct > 0 ? "bg-blue-50" : "bg-slate-50")}>
         {statusIcon(topic)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-base font-black uppercase italic tracking-tight truncate", done ? "text-slate-400 line-through" : "text-slate-900")}>{topic.name}</p>
        <div className="flex items-center gap-3 mt-1">
           {topic.estimatedStudyMinutes && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {topic.estimatedStudyMinutes}m Sync</p>}
           {pct > 0 && !done && <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 fill-current" /> {pct}% Calibrated</p>}
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></div>
    </motion.div>
  );
}

function ChapterAccordion({ chapter, batchId, defaultOpen }: { chapter: CourseChapter; batchId: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const completedCount = chapter.topics.filter(t => t.completedAt).length;
  const allDone = completedCount === chapter.topics.length && chapter.topics.length > 0;

  return (
    <div className={cn("rounded-[2rem] overflow-hidden transition-all duration-300 border mb-4", open ? "bg-white/40 border-white shadow-2xl" : "bg-white/10 border-transparent hover:border-white/40 hover:bg-white/20")}>
      <button className="w-full flex items-center gap-6 px-6 py-6 transition-all text-left" onClick={() => setOpen(o => !o)}>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", allDone ? "bg-emerald-500 text-white shadow-emerald-500/20" : open ? "bg-slate-900 text-white" : "bg-white text-slate-400")}>
           {allDone ? <CheckCircle2 className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter truncate">{chapter.name}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{completedCount}/{chapter.topics.length} Node{chapter.topics.length !== 1 ? "s" : ""} Secured</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown className={cn("w-6 h-6 transition-colors", open ? "text-slate-900" : "text-slate-300")} /></motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-6 space-y-2">{chapter.topics.map(t => <TopicRow key={t.id} topic={t} batchId={batchId} />)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectSection({ subject, batchId, defaultOpen }: { subject: CourseSubject; batchId: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const color = subject.colorCode ?? BLUE;
  const totalTopics = subject.chapters.reduce((a, c) => a + c.topics.length, 0);
  const doneTopics = subject.chapters.reduce((a, c) => a + c.topics.filter(t => t.completedAt).length, 0);
  
  return (
    <div className="mb-10">
      <button className="w-full flex items-center gap-6 px-10 py-6 rounded-[2.5rem] text-left transition-all hover:shadow-2xl hover:scale-[1.01] bg-white/60 border border-white" onClick={() => setOpen(o => !o)}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: color }}>
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black uppercase italic tracking-tighter" style={{ color }}>{subject.name}</p>
          <div className="flex items-center gap-4 mt-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{doneTopics}/{totalTopics} Nodes Secured</p>
             <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{subject.chapters.length} Command Sectors</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="w-8 h-8" style={{ color }} /></motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-6 pl-4 sm:pl-10">
            {subject.chapters.map((ch, ci) => <ChapterAccordion key={ch.id} chapter={ch} batchId={batchId} defaultOpen={ci === 0} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentCourseDetailPage() {
  const { batchId = "" } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseCurriculum(batchId);

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center gap-6">
       <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Monitor className="w-8 h-8 animate-spin text-indigo-600" /></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Directory</p>
    </div>
  );

  if (isError || !data) return (
    <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><Monitor className="w-10 h-10 text-slate-200" /></div>
      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Curriculum Lost</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">Unable to resolve curriculum frequency. Tactical fallback required.</p>
      <button onClick={() => navigate("/student/courses")} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl"><ArrowLeft className="w-4 h-4" /> Return to Directory</button>
    </div>
  );

  const { batch, subjects, progress } = data;
  const pct = progress?.overallPct ?? 0;

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <button onClick={() => navigate("/student/courses")} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors group w-fit">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Back to Directory
        </button>

        <CardGlass className="p-0 border-white bg-slate-950 text-white shadow-3xl overflow-hidden">
           <div className="relative p-10 sm:p-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                         <Layers className="w-3.5 h-3.5 text-indigo-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Curriculum Analysis</span>
                       </div>
                       {batch.examTarget && <span className="text-[9px] font-black bg-indigo-600/60 px-4 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-400/30">{batch.examTarget} Target</span>}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter leading-tight uppercase mb-6">{batch.name}</h1>
                    <div className="max-w-md">
                       <div className="flex justify-between items-end mb-3">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Syllabus Synchronization</p>
                          <p className="text-2xl font-black text-indigo-300 italic underline leading-none">{pct}%</p>
                       </div>
                       <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <motion.div className="h-full rounded-full shadow-lg" style={{ background: "linear-gradient(90deg, #6366f1, #a855f7)" }} initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1.2 }} />
                       </div>
                    </div>
                 </div>

                 <div className="lg:w-80 grid grid-cols-1 gap-4 shrink-0">
                    {[
                      { label: "Nodes Secured", val: `${progress?.completedTopics}/${progress?.totalTopics}`, icon: BookOpen, color: "text-indigo-400" },
                      { label: "Optical Feeds", val: `${progress?.completedLectures}/${progress?.totalLectures}`, icon: Video, color: "text-purple-400" },
                      { label: "Sync Velocity", val: `${pct}%`, icon: TrendingUp, color: "text-emerald-400" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                         <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white"><s.icon className={cn("w-6 h-6", s.color)} /></div>
                         <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.label}</p>
                            <p className="text-lg font-black text-white italic truncate">{s.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </CardGlass>

        <section className="space-y-12">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><Monitor className="w-6 h-6" /></div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter italic">Structural Directory</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Command Sectors</p>
              </div>
           </div>

           {subjects.length === 0 ? (
             <div className="text-center py-40 bg-white/20 border-2 border-dashed border-white/60 rounded-[3rem]">
               <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Matrix Empty</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No syllabus data discovered in this frequency.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {subjects.map((s, si) => <SubjectSection key={s.id} subject={s} batchId={batchId} defaultOpen={si === 0} />)}
             </div>
           )}
        </section>
    </div>
  );
}
