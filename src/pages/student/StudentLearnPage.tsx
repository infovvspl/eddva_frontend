import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle, CheckCircle2, ChevronRight, Clock, Flame, Image as ImageIcon,
  MoreVertical, Play, MessageSquare, Send, Sparkles, BookOpen, Target, LayoutGrid,
  Lock, Maximize2, RotateCcw, Volume2, Award, FileText, BarChart2
} from "lucide-react";

import { useStudentMe, useSubjects, useProgressOverview, useChapters } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentLearnPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: subjects = [] } = useSubjects();
  const activeSub = subjects[0]; // mock active subject
  const { data: chapters = [] } = useChapters(activeSub?.id ?? "");

  const [activeTab, setActiveTab] = useState<"video" | "notes" | "practice" | "quiz">("video");
  const [doubtText, setDoubtText] = useState("");

  // Mock states based on requirements
  const streak = me?.student?.streakDays || 3;
  const progressPct = 45;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 2. TOP BAR (CONTEXT + NAVIGATION) */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/student")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center text-sm font-semibold text-slate-400">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Physics</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Thermodynamics</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-slate-800 font-bold">Laws of Thermodynamics</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-slate-500">Progress: {progressPct}%</span>
             <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
             </div>
          </div>
          
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
             <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Flame className="w-4 h-4 fill-current" /> Streak: {streak} days
             </div>
             <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                <Sparkles className="w-4 h-4 fill-current" /> +50 XP
             </div>
          </div>
        </div>
      </header>

      {/* 1. MAIN LAYOUT: Sidebar | Main Content | Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 4. LEFT SIDEBAR (LEARNING PATH) */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0">
          <div className="p-5 border-b border-slate-100">
             <h2 className="text-lg font-bold text-slate-900 leading-tight">Thermodynamics</h2>
             <p className="text-xs font-semibold text-slate-500 mt-1">4 Modules · 2h 15m remaining</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 custom-scrollbar">
             {/* Mocking chapters/topics based on prompts */}
             <div className="mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">
                   <span>Topics</span>
                </div>
                
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                   <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                   <span className="text-sm font-semibold text-slate-600 truncate group-hover:text-slate-900">Intro to Thermodynamics</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                   <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                   <span className="text-sm font-semibold text-slate-600 truncate group-hover:text-slate-900">Zeroth & First Law</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-left transition-colors shadow-sm relative">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                   <Play className="w-5 h-5 text-indigo-600 fill-indigo-600 shrink-0 ml-1" />
                   <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-indigo-700 block truncate">Entropy</span>
                      <span className="text-[10px] font-bold text-indigo-400 mt-0.5 block">Currently Playing</span>
                   </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group opacity-70">
                   <Lock className="w-5 h-5 text-slate-300 shrink-0" />
                   <span className="text-sm font-semibold text-slate-500 truncate">Heat Engine & Carnot Cycle</span>
                </button>
             </div>
          </div>
        </aside>

        {/* 3. MAIN CONTENT AREA (CENTER) */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          
          {/* Main Content Tabs */}
          <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-center items-center gap-2 px-8 shrink-0 relative z-10">
             {[
               { id: "video", label: "Video", icon: Play },
               { id: "notes", label: "Notes", icon: FileText },
               { id: "practice", label: "Practice", icon: Target },
               { id: "quiz", label: "Quiz", icon: BarChart2 },
             ].map((t) => (
               <button
                 key={t.id} onClick={() => setActiveTab(t.id as any)}
                 className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                   activeTab === t.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                 )}
               >
                 <t.icon className={cn("w-4 h-4", activeTab === t.id ? "fill-current opacity-80" : "")} /> {t.label}
               </button>
             ))}
          </div>

          {/* Dynamic Content Pane */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth">
             <div className="max-w-4xl mx-auto w-full pb-32">
                
                <AnimatePresence mode="wait">
                  {activeTab === "video" && (
                    <motion.div key="video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                       
                       {/* 9. CONTINUE LEARNING RESUME BANNER */}
                       <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Clock className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Resume from last session</p>
                                <p className="text-sm font-bold text-indigo-900">Thermodynamics → Lecture 3 / 12:45</p>
                             </div>
                          </div>
                       </div>

                       {/* A. VIDEO PLAYER */}
                       <div className="bg-black aspect-video rounded-3xl overflow-hidden shadow-2xl relative group">
                          {/* Mock video cover */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                             <Play className="w-16 h-16 text-white/50" />
                          </div>
                          
                          {/* Controls Overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-24 pb-6 px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="h-1 bg-white/20 rounded-full mb-4 relative cursor-pointer">
                                <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
                             </div>
                             <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                   <button className="hover:text-indigo-400 transition-colors"><Play className="w-6 h-6 fill-current" /></button>
                                   <button className="hover:text-indigo-400 transition-colors"><Volume2 className="w-5 h-5" /></button>
                                   <span className="text-xs font-semibold tabular-nums">12:45 / 32:10</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <button className="text-xs font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">1.5x</button>
                                   <button className="hover:text-indigo-400 transition-colors"><Maximize2 className="w-5 h-5" /></button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === "notes" && (
                     <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* B. NOTES / THEORY TAB */}
                        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-slate-800">
                           <h2 className="text-3xl font-bold mb-6 text-slate-900 tracking-tight">Understanding Entropy</h2>
                           <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:font-medium prose-p:text-slate-600 prose-p:leading-relaxed">
                              <p>Entropy is a measure of the disorder or randomness in a closed system. The second law of thermodynamics states that the total entropy of an isolated system can never decrease over time.</p>
                              
                              <div className="my-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-2xl">
                                 <h4 className="flex items-center gap-2 text-yellow-800 m-0 text-sm font-bold uppercase tracking-widest mb-2">
                                    <Sparkles className="w-4 h-4" /> Key Concept Highlight
                                 </h4>
                                 <p className="m-0 text-yellow-900 font-semibold text-base">In any spontaneous process, there is always an increase in the entropy of the universe (ΔS_univ {">"} 0).</p>
                              </div>

                              <h3>Mathematical Representation</h3>
                              <p>Change in entropy (ΔS) is defined by the heat transfer (Q) divided by temperature (T):</p>
                              <div className="bg-slate-50 rounded-xl p-4 text-center font-mono text-lg border border-slate-100 font-bold text-indigo-600 my-4">
                                 ΔS = Q_rev / T
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  )}

                  {activeTab === "practice" && (
                     <motion.div key="practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* C. PRACTICE QUESTIONS */}
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-bold text-slate-900">Practice Module</h2>
                              <p className="text-sm font-semibold text-slate-500 mt-1">Previous Year Questions (PYQs)</p>
                           </div>
                           <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100">Q1 of 15</span>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-6">
                           <p className="text-lg font-bold text-slate-800 leading-relaxed mb-8">
                              Q1: What is the primary characteristic of entropy in an isolated theoretical system?
                           </p>

                           <div className="space-y-3">
                              {["It remains perfectly constant over time",
                                "It always decreases spontaneously",
                                "It either increases or remains constant",
                                "It fluctuates periodically"
                              ].map((opt, i) => (
                                 <button key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 text-left transition-colors group">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-indigo-500 flex items-center justify-center shrink-0" />
                                    <span className="font-semibold text-slate-700">{opt}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="flex justify-end">
                           <button className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors">Submit Answer</button>
                        </div>
                     </motion.div>
                  )}

                  {activeTab === "quiz" && (
                     <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-20">
                        <Award className="w-16 h-16 text-indigo-300 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Topic Milestone Test</h2>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Verify your understanding before moving to the next topic and earn massive XP.</p>
                        <button className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-xl hover:bg-indigo-700 transition-all text-lg hover:scale-105">
                           Start Quick Test
                        </button>
                     </motion.div>
                  )}

                </AnimatePresence>

             </div>
          </div>

          {/* 6. ACTION BUTTONS (BOTTOM FIX) */}
          <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-8 z-20 shrink-0">
             <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Previous Topic
             </button>

             <div className="flex items-center gap-3">
                <button className="px-6 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center gap-2">
                   <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2">
                   Next Topic <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>

        </main>

        {/* 5. RIGHT PANEL (SMART ASSIST) & 7. DOUBT SYSTEM */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shrink-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
             
             {/* Stats */}
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <BarChart2 className="w-4 h-4" /> Session Overview
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                   <div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                         <span>Topic Progress</span>
                         <span className="text-indigo-600">60%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500" style={{ width: '60%' }} />
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                         <span>Course Progress</span>
                         <span className="text-emerald-600">30%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
                      </div>
                   </div>
                </div>
             </div>

             {/* Time Spent */}
             <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                   <Clock className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Time Spent Today</p>
                   <p className="text-lg font-black text-indigo-900 leading-none mt-0.5">45 min</p>
                </div>
             </div>

             {/* Next Action */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-xl rounded-full" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Smart Action</p>
                <h4 className="text-lg font-bold mb-4 relative z-10">Next: Practice Questions</h4>
                <button onClick={() => setActiveTab("practice")} className="w-full py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors relative z-10">
                   Start Practice
                </button>
             </div>

             {/* 7. DOUBT SYSTEM */}
             <div className="pt-4 border-t border-slate-100 border-dashed">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4" /> Ask Doubt
                </h3>
                <div className="bg-white border focus-within:border-indigo-500 border-slate-200 rounded-2xl p-3 shadow-sm transition-colors">
                   <textarea 
                     className="w-full h-24 bg-transparent resize-none text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none custom-scrollbar" 
                     placeholder="Confused? Ask the AI or mentor anytime..."
                     value={doubtText}
                     onChange={(e) => setDoubtText(e.target.value)}
                   />
                   <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                         <ImageIcon className="w-4 h-4" />
                      </button>
                      <button className={cn("px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors", doubtText.trim() ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
                         Send <Send className="w-3 h-3" />
                      </button>
                   </div>
                </div>
             </div>

          </div>
        </aside>
        
      </div>
    </div>
  );
}
