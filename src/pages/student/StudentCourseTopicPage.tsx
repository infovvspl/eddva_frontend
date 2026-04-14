import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Download, Clock, CheckCircle2,
  Video, BookOpen, FileType, Monitor, Zap, Layers, Sparkles, ChevronRight, Play
} from "lucide-react";
import { useCourseTopicDetail } from "@/hooks/use-student";
import type { TopicLecture, TopicResource } from "@/lib/api/student";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null): string {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s > 0 ? s + "s" : ""}`.trim() : `${s}s`;
}

function LectureCard({ lecture, batchId }: { lecture: TopicLecture; batchId: string }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = React.useState(false);
  const thumb = resolveUrl(lecture.thumbnailUrl);
  const pct = lecture.watchProgress ?? 0;
  const done = !!lecture.isCompleted;

  return (
    <CardGlass onClick={() => navigate(`/student/lectures/${lecture.id}?batchId=${batchId}`)} className="p-3 group border-white bg-white/60 shadow-3xl">
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-24 shrink-0 rounded-2xl bg-slate-900 overflow-hidden shadow-xl border border-white/10">
          {lecture.thumbnailUrl && !imgError ? (
            <img src={thumb} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-950"><Video className="w-8 h-8 text-white/10" /></div>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
             <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl"><Play className="w-5 h-5 text-white fill-white" /></div>
          </div>
          {done && <div className="absolute top-2 right-2"><div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="w-4 h-4" /></div></div>}
          {pct > 0 && !done && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"><motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} /></div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2.5 py-1 rounded-lg">Operational Feed</span>
             {done && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">Synthesized</span>}
          </div>
          <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight group-hover:text-blue-600 transition-colors">{lecture.title}</h4>
          <div className="flex items-center gap-4 mt-3">
             {lecture.duration && <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {formatDuration(lecture.duration)} Cycle</div>}
             {pct > 0 && !done && <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg"><Zap className="w-3.5 h-3.5 fill-current" /> {pct}% Calibrated</div>}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></div>
      </div>
    </CardGlass>
  );
}

function resourceIcon(type: string) {
  if (type === "pdf" || type === "document") return <FileText className="w-5 h-5 text-red-500" />;
  if (type === "video") return <Video className="w-5 h-5 text-blue-500" />;
  return <FileType className="w-5 h-5 text-slate-400" />;
}

function ResourceCard({ resource }: { resource: TopicResource }) {
  const url = resolveUrl(resource.fileUrl);
  return (
    <CardGlass className="p-0 border-white bg-white/60 hover:bg-white transition-all group shadow-3xl">
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 px-6 py-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">{resourceIcon(resource.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-slate-900 uppercase italic tracking-tight truncate mb-1">{resource.title}</p>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{resource.type.toUpperCase()} Manifest</span>
             <span className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Download Ready</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Download className="w-5 h-5" /></div>
      </a>
    </CardGlass>
  );
}

export default function StudentCourseTopicPage() {
  const { batchId = "", topicId = "" } = useParams<{ batchId: string; topicId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseTopicDetail(batchId, topicId);

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center gap-6">
       <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Monitor className="w-8 h-8 animate-spin text-indigo-600" /></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Manifest</p>
    </div>
  );

  if (isError || !data) return (
    <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><Monitor className="w-10 h-10 text-slate-200" /></div>
      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Frequency Lost</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">Unable to resolve topic manifest. Tactical fallback required.</p>
      <button onClick={() => navigate(`/student/courses/${batchId}`)} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl"><ArrowLeft className="w-4 h-4" /> Return to Sector</button>
    </div>
  );

  const { topic, subject, chapter, lectures, resources } = data;

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(`/student/courses/${batchId}`)} className="w-14 h-14 rounded-2xl bg-white border border-white flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-xl group"><ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /></button>
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => navigate("/student/courses")}>DIRECTORY</span>
                <ChevronRight className="w-3 h-3" />
                <span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => navigate(`/student/courses/${batchId}`)}>{subject?.name}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-600 italic underline decoration-blue-200">{chapter?.name}</span>
             </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full space-y-12">
           <CardGlass className="p-12 border-white bg-slate-950 text-white shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Topic Sector Manifest</span>
                    </div>
                    {topic.status && <div className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border", topic.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30")}>{topic.status === "completed" ? "SYNTHESIZED" : "OPERATIONAL"}</div>}
                 </div>
                 <h1 className="text-4xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight mb-8">{topic.name}</h1>
                 <div className="flex flex-wrap items-center gap-6">
                    {topic.estimatedStudyMinutes && (
                       <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                          <Clock className="w-5 h-5 text-blue-400" />
                          <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Duration</p><p className="text-sm font-black text-white uppercase italic">~{topic.estimatedStudyMinutes}m Cycle</p></div>
                       </div>
                    )}
                    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                       <Zap className="w-5 h-5 text-amber-400" />
                       <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">XP Yield</p><p className="text-sm font-black text-white uppercase italic">High Prop</p></div>
                    </div>
                 </div>
              </div>
           </CardGlass>

           <div className="space-y-16">
              {lectures.length > 0 && (
                 <section className="space-y-8">
                    <div className="flex items-center gap-4 px-6">
                       <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl"><Video className="w-6 h-6" /></div>
                       <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Visual Feeds</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{lectures.length} Neural Modules Detected</p></div>
                    </div>
                    <div className="space-y-4">{lectures.map((lec, i) => <motion.div key={lec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><LectureCard lecture={lec} batchId={batchId} /></motion.div>)}</div>
                 </section>
              )}

              {resources.length > 0 && (
                 <section className="space-y-8">
                    <div className="flex items-center gap-4 px-6">
                       <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><BookOpen className="w-6 h-6" /></div>
                       <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Knowledge Manifest</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{resources.length} Static Assets Discovered</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{resources.map((r, i) => <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}><ResourceCard resource={r} /></motion.div>)}</div>
                 </section>
              )}

              {lectures.length === 0 && resources.length === 0 && (
                 <CardGlass className="py-32 text-center border-dashed border-2 border-white/60 bg-white/20">
                    <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-6 animate-pulse" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Manifest Empty</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Neural assets for this topic are currently being synthesized.</p>
                 </CardGlass>
              )}
           </div>
        </div>
    </div>
  );
}
