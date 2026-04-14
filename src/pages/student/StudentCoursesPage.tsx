import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, FileText, FlaskConical, PenTool, CheckCircle, Clock, BookOpen, Search, Filter, 
  GraduationCap, ChevronRight, Activity, BarChart2, Library, ShieldCheck, Loader2
} from "lucide-react";
import { useMyCourses } from "@/hooks/use-student";
import type { MyCourse } from "@/lib/api/student";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading, isError } = useMyCourses();
  
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed" | "not_started">("ongoing");
  const [search, setSearch] = useState("");

  if (isLoading) return (
     <div className="py-40 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
     </div>
  );

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
         <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Library className="w-10 h-10 text-indigo-500" />
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-2">📚 No courses yet</h2>
         <p className="text-slate-500 mb-8 max-w-sm">Start your journey now by enrolling in a new module!</p>
         <button onClick={() => navigate("/")} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30">
            Browse Courses
         </button>
      </div>
    );
  }

  // Filter logic
  const filteredCourses = courses.filter(c => {
     if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
     const pct = c.progress?.overallPct ?? 0;
     if (activeTab === "completed" && pct < 100) return false;
     if (activeTab === "not_started" && pct > 0) return false;
     if (activeTab === "ongoing" && pct === 100) return false;
     return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-32">
      
      {/* 1. HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
            <p className="text-slate-500 text-sm">Track, manage, and continue your learning journey.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Search courses..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-64"
               />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all shadow-sm">
               <Filter className="w-4 h-4" /> Filter
            </button>
         </div>
      </header>

      {/* 6. CONTINUE LEARNING (HIGHLIGHT) */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
               <Play className="w-3.5 h-3.5 fill-current" /> Continue Learning 🚀
            </div>
            <h2 className="text-2xl font-bold mb-1">Physics → Thermodynamics → Lecture 4</h2>
            <p className="text-indigo-200 text-sm">Last studied: Today at 10:00 AM</p>
         </div>
         <button onClick={() => navigate("/student/learn")} className="relative z-10 px-8 py-3.5 bg-white text-indigo-900 font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg whitespace-nowrap">
            <Play className="w-4 h-4 fill-current" /> Resume Now
         </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 space-y-8">
            
            {/* 3. COURSE STATUS SEGMENT (TABS) */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
               {[
                 { id: "ongoing", label: "🔵 Ongoing" },
                 { id: "completed", label: "🟢 Completed" },
                 { id: "not_started", label: "🔴 Not Started" }
               ].map((tab) => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={cn(
                     "px-6 py-3 text-sm font-semibold border-b-2 transition-all block",
                     activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                   )}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            {/* 2. COURSE CARDS */}
            <div className="space-y-6">
               {filteredCourses.length > 0 ? filteredCourses.map((course) => {
                 const pct = course.progress?.overallPct ?? 0;
                 const thumb = resolveUrl(course.thumbnailUrl);
                 return (
                   <div key={course.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 group">
                      <div className="w-full sm:w-48 h-36 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                         {thumb ? (
                            <img src={thumb} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
                               <BookOpen className="w-8 h-8 text-indigo-200" />
                            </div>
                         )}
                         {course.examTarget && (
                           <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold rounded-lg uppercase text-slate-700 shadow-sm">
                              {course.examTarget}
                           </div>
                         )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                         <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{course.name}</h3>
                         </div>
                         <p className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> By {course.teacher?.name || "Expert Faculty"}
                         </p>

                         <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs font-semibold">
                               <span className="text-slate-600">Progress: {pct}%</span>
                               <span className="text-slate-500">{course.progress?.completedTopics || 0} / {course.progress?.totalTopics || 0} chapters completed</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                               <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-2">
                               <Clock className="w-3.5 h-3.5" /> Last studied: 2 days ago
                            </p>
                         </div>

                         {/* ACTIONS */}
                         <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button onClick={() => navigate(`/student/courses/${course.id}`)} className="px-4 py-2 text-[13px] font-bold bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100/50">
                               <Play className="w-3 h-3 fill-current" /> Resume
                            </button>
                            <button className="px-4 py-2 text-[13px] font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                               <FileText className="w-3.5 h-3.5" /> Notes
                            </button>
                            <button className="px-4 py-2 text-[13px] font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                               <PenTool className="w-3.5 h-3.5" /> Practice
                            </button>
                            <button className="px-4 py-2 text-[13px] font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                               <FlaskConical className="w-3.5 h-3.5" /> Test
                            </button>
                         </div>
                      </div>
                   </div>
                 );
               }) : (
                 <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <p className="text-slate-500 font-medium">No courses found in this category.</p>
                 </div>
               )}
            </div>
         </div>

         {/* RIGHT SIDEBAR: QUICK STATS & ACTIVITY */}
         <div className="space-y-6">
            
            {/* 4. QUICK STATS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Your Overview</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/60">
                     <p className="text-2xl font-black text-slate-800">{courses.length}</p>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">📚 Total Courses</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                     <p className="text-2xl font-black text-indigo-600">2</p>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-1">🔥 Active</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                     <p className="text-2xl font-black text-emerald-600">3</p>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mt-1">✅ Completed</p>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                     <p className="text-2xl font-black text-amber-600">12</p>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-1">⏳ Pending Tasks</p>
                  </div>
               </div>
            </div>

            {/* 5. RECENT ACTIVITY */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Recent Activity
               </h3>
               <div className="space-y-5">
                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100/50">
                        <Play className="w-4 h-4 fill-current" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-800 line-clamp-1 leading-snug">Thermodynamics Lecture 3</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">Completed · 2 hours ago</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100/50">
                        <CheckCircle className="w-4 h-4" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-800 line-clamp-1 leading-snug">Mock Test: Kinematics</p>
                        <p className="text-[11px] font-semibold text-emerald-600 mt-1">Score: 78% · Yesterday</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50">
                        <FlaskConical className="w-4 h-4" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-800 line-clamp-1 leading-snug">Practice: Laws of Motion</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">Attempted 45 Qs · 3 days ago</p>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>

    </div>
  );
}
