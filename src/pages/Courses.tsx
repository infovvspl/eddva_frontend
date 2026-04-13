import React, { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { FadeUp, Label } from "@/components/landing/LandingPrimitives";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, Star, Clock, Users, Play, ArrowRight,
  TrendingUp, BookOpen, GraduationCap, Brain, Zap,
  CheckCircle2, PlayCircle, BarChart3
} from "lucide-react";
import { B, P, T } from "@/components/landing/DesignTokens";

const courses = [
  { 
    id: 1, 
    title: "IIT-JEE Ultimate Prep 2025", 
    instructor: "Dr. Arvind Kumar", 
    rating: 4.9, 
    students: "12,400", 
    duration: "12 Months",
    type: "Competitive",
    level: "Advanced",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    isFeatured: true,
    isAIRecommended: true,
    tags: ["JEE Mains", "Advanced", "Physics"]
  },
  { 
    id: 2, 
    title: "NEET Biology Masterclass", 
    instructor: "Sarah D'souza", 
    rating: 4.8, 
    students: "8,200", 
    duration: "8 Months",
    type: "Competitive",
    level: "Intermediate",
    image: "https://images.unsplash.com/photo-1532187875605-186c73196ed8?auto=format&fit=crop&q=80&w=600",
    size: "large",
    tags: ["Biology", "NEET UG"]
  },
  { 
    id: 3, 
    title: "CBSE Class 12 Boards", 
    instructor: "Team EDDVA", 
    rating: 4.7, 
    students: "15,000", 
    duration: "6 Months",
    type: "School",
    level: "Beginner",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600",
    size: "small",
    tags: ["CBSE", "Class 12"]
  },
  { 
    id: 4, 
    title: "Quantum Physics AI Guide", 
    instructor: "AI Tutor", 
    rating: 5.0, 
    students: "2,100", 
    duration: "2 Months",
    type: "Skill-based",
    level: "Advanced",
    isAIRecommended: true,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600",
    size: "small",
    tags: ["Physics", "AI"]
  },
  { 
    id: 5, 
    title: "SSC CGL Strategy Course", 
    instructor: "Vikram Singh", 
    rating: 4.6, 
    students: "5,400", 
    duration: "4 Months",
    type: "Govt",
    level: "Intermediate",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
    size: "medium",
    tags: ["SSC", "Aptitude"]
  }
];

const continueLearning = [
  { title: "Physical Chemistry", progress: 65, lastWatched: "Equilibrium Part 1", color: B },
  { title: "Calculus Mastery", progress: 42, lastWatched: "Derivatives Basics", color: P },
  { title: "Modern Physics", progress: 88, lastWatched: "Photoelectric Effect", color: T }
];

const videoConcepts = [
  { title: "Newton's 3rd Law Simplified", duration: "1:45", views: "12K", instructor: "AI Assistant" },
  { title: "The Krebs Cycle in 3 Minutes", duration: "3:12", views: "8.5K", instructor: "Dr. Sarah" },
  { title: "Integrals: Visual Intro", duration: "2:30", views: "15K", instructor: "Prof. Vikram" }
];

const CourseCard = ({ course, size = "medium" }: { course: typeof courses[0], size?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className={`group relative overflow-hidden rounded-[24px] border border-white bg-white/40 shadow-sm backdrop-blur-xl transition-all duration-300
        ${size === "large" ? "md:col-span-2 md:row-span-2" : ""}
        ${size === "medium" ? "md:col-span-2 md:row-span-1" : ""}
        ${size === "small" ? "md:col-span-1 md:row-span-1" : ""}
      `}
    >
      <div className="absolute inset-0 z-0">
        <img src={course.image} alt={course.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white text-left">
        <div className="mb-3 flex flex-wrap gap-2">
          {course.isAIRecommended && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              <Brain className="h-3 w-3" /> AI Recommended
            </span>
          )}
          {course.tags.map(tag => (
            <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md uppercase tracking-wider">{tag}</span>
          ))}
        </div>

        <h3 className="mb-2 text-[20px] font-black leading-tight sm:text-[24px]">{course.title}</h3>
        
        <div className="mb-4 flex items-center gap-4 text-[12px] font-medium opacity-80">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.students}</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 border-none" /> {course.rating}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4 border-t border-gray-200 pt-4">
                <p className="mb-3 text-[13px] font-medium leading-relaxed opacity-90">
                  Detailed syllabus covering {course.duration} of immersive learning with {course.instructor}.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-xl bg-white py-2.5 text-[13px] font-black text-gray-900 transition-transform active:scale-95">
                    Enroll Now
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-gray-900 backdrop-blur-md transition-colors hover:bg-white/30">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function Courses() {
  const [activeType, setActiveType] = useState("Competitive");
  const [aiOnly, setAiOnly] = useState(false);

  return (
    <LandingLayout>
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden py-24 pb-32">
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #ffffff 0%, #F0F7FF 45%, #F5F3FF 100%)" }} />
        <div className="absolute inset-0 -z-10 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle, ${B} 1.5px, transparent 1.5px)`, backgroundSize: "36px 36px" }} />
        
        <div className="mx-auto max-w-7xl px-6 text-center">
          <FadeUp>
            <Label color="purple">Master Your Future</Label>
            <h1 className="mx-auto mt-6 max-w-4xl text-[48px] font-extrabold leading-[1.1] tracking-tight text-gray-900 lg:text-[64px]">
              Master Your Future with <span style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-Powered Learning</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[18px] font-medium leading-relaxed text-gray-500">
              Interactive, personalized courses tailored precisely for your exam success and skill growth.
            </p>

            <div className="mx-auto mt-10 w-full max-w-2xl">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search courses (e.g. JEE Physics, Python for Kids...)"
                  className="h-16 w-full rounded-[24px] border border-white bg-white/40 pl-16 pr-6 text-[16px] font-bold text-gray-800 shadow-2xl backdrop-blur-xl outline-none transition-all focus:border-blue-200 focus:bg-white/80"
                />
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["JEE Mains", "NEET UG", "Class 12 Boards", "UPSC", "Coding"].map(tag => (
                  <button key={tag} className="rounded-full border border-blue-50 bg-white/50 px-4 py-1.5 text-[12px] font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── STICKY FILTERS ─── */}
      <div className="sticky top-[73px] z-[40] border-y border-gray-100 bg-white/80 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide sm:pb-0">
            {["All", "Competitive", "School", "Govt", "Skill-based"].map(type => (
              <button 
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-shrink-0 rounded-full px-5 py-2 text-[13px] font-black uppercase tracking-widest transition-all
                  ${activeType === type ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-gray-500">AI Recommended</span>
              <button 
                onClick={() => setAiOnly(!aiOnly)}
                className={`relative h-6 w-11 rounded-full bg-gray-200 transition-colors ${aiOnly ? "bg-blue-500" : ""}`}
              >
                <motion.div 
                  animate={{ x: aiOnly ? 22 : 2 }}
                  className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm" 
                />
              </button>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-50">
              <Filter className="h-4 w-4" /> More Filters
            </button>
          </div>
        </div>
      </div>

      {/* ─── CONTINUE LEARNING ─── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-[28px] font-black tracking-tight text-gray-900">Continue Learning</h2>
            <button className="text-[14px] font-bold text-blue-600 hover:underline">View Progress</button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {continueLearning.map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -4 }}
                className="min-w-[300px] flex-shrink-0 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-[16px] font-black text-gray-900">{item.title}</h4>
                  <span className="text-[12px] font-black text-blue-600">{item.progress}%</span>
                </div>
                <div className="mb-6 h-2 w-full rounded-full bg-gray-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    className="h-full rounded-full" 
                    style={{ background: item.color }}
                  />
                </div>
                <p className="mb-4 text-[12px] text-gray-400">Next: <span className="font-bold text-gray-600">{item.lastWatched}</span></p>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-[14px] font-black text-gray-900 transition-colors hover:bg-gray-900 hover:text-white">
                  Resume Lecture <Play className="h-3.5 w-3.5 fill-current" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MAIN CATALOG BENTO ─── */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-14 text-center">
            <h2 className="text-[36px] font-black tracking-tight text-gray-900">Explore Catalog</h2>
            <p className="mt-4 text-gray-500 font-medium">Bespoke curriculum designed by India's top educators and AI specialized tools.</p>
          </FadeUp>

          {/* Bento Grid */}
          <div className="grid gap-6 md:grid-cols-4 md:grid-rows-2">
            {/* Featured Horizontal */}
            <div className="md:col-span-4 lg:col-span-3">
               <CourseCard course={courses[0]} size="medium" />
            </div>
            {/* Small card to fit */}
            <div className="md:col-span-1 lg:col-span-1">
               <CourseCard course={courses[2]} size="small" />
            </div>
            {/* Bento items */}
            <CourseCard course={courses[1]} size="large" />
            <CourseCard course={courses[3]} size="small" />
            <CourseCard course={courses[4]} size="medium" />
          </div>
        </div>
      </section>

      {/* ─── QUICK CONCEPTS VIDEOS ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-12">
            <h2 className="text-[32px] font-black tracking-tight text-gray-900">Quick Concepts</h2>
            <p className="text-gray-500 font-medium">Short 2-5 minute bites for those hard-to-grasp topics.</p>
          </FadeUp>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {videoConcepts.map((vid, i) => (
               <FadeUp key={i} delay={i * 0.1}>
                 <motion.div whileHover={{ scale: 1.02 }} className="group relative overflow-hidden rounded-[24px]">
                    <div className="aspect-video w-full bg-gray-200">
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:opacity-0">
                          <PlayCircle className="h-12 w-12 text-white" />
                       </div>
                       {/* placeholder thumbnail with color gradient */}
                       <div className="h-full w-full bg-gradient-to-br from-blue-100 to-purple-100" />
                    </div>
                    <div className="p-4">
                       <h4 className="mb-1 text-[16px] font-black text-gray-900">{vid.title}</h4>
                       <div className="flex items-center gap-3 text-[12px] font-bold text-gray-400">
                          <span>{vid.duration} mins</span>
                          <span>•</span>
                          <span>{vid.views} views</span>
                       </div>
                    </div>
                 </motion.div>
               </FadeUp>
             ))}
          </div>
        </div>
      </section>

      {/* ─── AI PICKED FOR YOU ─── */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #EEF4FF 0%, #F5F3FF 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-12 lg:grid lg:grid-cols-2">
            <FadeUp>
               <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-blue-600">AI Synergy</span>
               </div>
               <h2 className="mt-6 text-[40px] font-black leading-tight text-gray-900">Picked for You,<br /><span className="text-blue-600">Based on behavior</span></h2>
               <p className="mt-6 text-[18px] font-medium leading-relaxed text-gray-500">
                  Our neural engine analyzes your strengths and previous mock test performance to suggest modules that give you the highest mark-jump potential.
               </p>
               <div className="mt-8 space-y-4">
                  {[
                    { icon: <Zap className="h-5 w-5" />, label: "Mark Jump", text: "Targeting +25 marks in Physics NEET" },
                    { icon: <BarChart3 className="h-5 w-5" />, label: "Weak Area", text: "Focusing on Differential Equations" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{item.icon}</div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                          <p className="text-[14px] font-bold text-gray-900">{item.text}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </FadeUp>

            <div className="relative w-full">
               <CourseCard course={courses[1]} />
               <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-1/4 rounded-2xl bg-white p-4 shadow-2xl border border-blue-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[13px] font-bold text-gray-900">98.2% Match Rank</span>
                  </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
