import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { B, P, T, BG_STUDIO } from "@/components/landing/DesignTokens";
import { FadeUp } from "@/components/landing/LandingPrimitives";
import { 
  FileText, Search, 
  ArrowRight, Filter,
  BookOpen, Brain, Library, GraduationCap, Play,
  Clock, Sparkles, Zap, Star
} from "lucide-react";
import bannerImg from "@/assets/education-learning-study-concept-apacity-development-training-personal-development-mixed-media-business_1085052-1781.avif";

/* ── Standard Content Mapping ── */
const CONTENT_MAP: Record<string, any> = {
  pyqs: {
    title: "Previous Year Questions",
    subtitle: "Master your exams with actual papers from the last 15 years. Solutions included.",
    icon: <FileText className="h-5 w-5" />,
    color: P,
    items: [
      { id: 1, title: "JEE Main 2024 - January", info: "All Shifts • Worked Solutions", badge: "Trending", duration: "90 Papers" },
      { id: 2, title: "NEET UG 2023 - All Codes", info: "Biology Focus • Video Solutions", badge: "New", duration: "1 Paper" },
      { id: 3, title: "UPSC Prelims 2015-2023", info: "GS + CSAT • Subject Wise", badge: "Elite", duration: "16 Papers" },
      { id: 4, title: "CBSE Class 12 Boards", info: "Last 10 Years • Science", badge: "Essential", duration: "30 Papers" },
      { id: 5, title: "GATE Mechanical", info: "Core Concept Solutions", badge: "New", duration: "12 Papers" },
      { id: 6, title: "JEE Advanced 2022", info: "Detailed Explanations", badge: "Hard", duration: "2 Papers" },
    ]
  },
  books: {
    title: "Premium Textbooks",
    subtitle: "Digital library of the most recommended books for competitive exams.",
    icon: <Library className="h-5 w-5" />,
    color: B,
    items: [
      { id: 1, title: "Concepts of Physics", info: "H.C. Verma • Full Solutions", badge: "Classic", duration: "450 Pages" },
      { id: 2, title: "Organic Chemistry", info: "M.S. Chauhan • Chapter Wise", badge: "Best", duration: "520 Pages" },
      { id: 3, title: "Objective NCERT - Bio", info: "MTG Biology latest revision.", badge: "Popular", duration: "800 Pages" },
      { id: 4, title: "Quantitative Aptitude", info: "R.S. Aggarwal for SSC/GATE.", badge: "Std", duration: "980 Pages" },
    ]
  },
  quiz: {
    title: "Interactive Quizzes",
    subtitle: "Test your speed and accuracy with real-time performance analysis.",
    icon: <GraduationCap className="h-5 w-5" />,
    color: T,
    items: [
      { id: 1, title: "Daily Physics Challenge", info: "15nd Quiz • Mechanics", badge: "Live", duration: "20 Min" },
      { id: 2, title: "Bio-Diversity Blitz", info: "NEET Focus • Top 50 Qs.", badge: "New", duration: "30 Min" },
      { id: 3, title: "Current Affairs Weekly", info: "UPSC Review • April 2024.", badge: "Hot", duration: "25 Min" },
      { id: 4, title: "Speed Math Quiz", info: "Calculation Tricks.", badge: "Easy", duration: "15 Min" },
    ]
  },
  videos: {
    title: "Concept Videos",
    subtitle: "Crisp, logic-driven lectures that cover entire chapters in minutes.",
    icon: <Play className="h-5 w-5" />,
    color: "#F59E0B",
    items: [
      { id: 1, title: "Calculus in 2 Hours", info: "Integration & Derivatives.", badge: "Hot", duration: "120 Min" },
      { id: 2, title: "Human Heart - 3D", info: "Complete Anatomy Recap.", badge: "Trending", duration: "45 Min" },
      { id: 3, title: "Organic Mechanisms", info: "Reactions crash course.", badge: "Best", duration: "90 Min" },
      { id: 4, title: "Modern Physics Recap", info: "Formula revision for JEE.", badge: "New", duration: "30 Min" },
    ]
  }
};

const subjects = ["General", "Physics", "Chemistry", "Math", "Biology"];

export default function StudyMaterialPage() {
  const { type = "pyqs" } = useParams<{ type: string }>();
  const [activeSubject, setActiveSubject] = useState("General");
  const content = CONTENT_MAP[type] || CONTENT_MAP.pyqs;

  return (
    <LandingLayout>
      <main className="min-h-screen pt-20" style={{ background: BG_STUDIO }}>
        
        {/* ══ HERO BANNER ══ */}
        <section className="relative h-[65vh] min-h-[460px] overflow-hidden">
          {/* full-bleed banner image */}
          <img
            src={bannerImg}
            alt="Study Material — Education Learning"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* rich overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(8,47,73,0.90) 0%, rgba(30,27,75,0.80) 50%, rgba(8,47,73,0.70) 100%)" }}
          />
          {/* bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: `linear-gradient(to bottom, transparent, ${BG_STUDIO})` }}
          />

          {/* content — centred */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <FadeUp>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/80 backdrop-blur-sm">
                <BookOpen className="h-3 w-3" /> Study Material
              </span>
              <h1 className="landing-title-hero mb-5 text-white">
                Explore{" "}
                <span style={{ background:`linear-gradient(135deg, ${content.color}, ${P})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  {content.title}
                </span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-[16px] font-medium leading-relaxed text-white/65">
                {content.subtitle} — Access over 50,000+ curated resources for your success.
              </p>

              {/* search bar */}
              <div className="w-full max-w-lg">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full h-14 rounded-2xl border border-gray-200 bg-white/90 pl-14 pr-6 text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all font-bold shadow-lg backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* quick stat chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  { icon:"📚", val:"50K+",  label:"Resources" },
                  { icon:"🎬", val:"10K+",  label:"Video Lectures" },
                  { icon:"📝", val:"5K+",   label:"Practice Tests" },
                  { icon:"⭐", val:"4.9★",  label:"Avg Rating" },
                ].map(s => (
                  <div key={s.label}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <span className="text-[15px]">{s.icon}</span>
                    <span className="text-[13px] font-bold text-white">{s.val}</span>
                    <span className="text-[11px] text-white/50">{s.label}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Simple Navigation ── */}
        <section className="sticky top-20 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
           <div className="landing-shell">
              <div className="flex items-center justify-between gap-8 h-20">
                 <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {Object.keys(CONTENT_MAP).map(key => (
                      <Link 
                        key={key} 
                        to={`/study-material/${key}`}
                        className={`px-6 py-2 rounded-xl text-[14px] font-bold uppercase tracking-wider transition-all
                          ${type === key ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}
                      >
                         {key}
                      </Link>
                    ))}
                 </div>
                 
                 <div className="hidden lg:flex items-center gap-2">
                    {subjects.map(sub => (
                      <button 
                        key={sub}
                        onClick={() => setActiveSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all
                          ${activeSubject === sub ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                      >
                         {sub}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* ── Standard Grid ── */}
        <section className="landing-section">
           <div className="landing-shell">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {content.items.map((item: any, i: number) => (
                   <FadeUp key={item.id} delay={i * 0.05}>
                      <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 transition-all hover:shadow-xl hover:border-gray-200">
                         <div className="aspect-[4/3] w-full rounded-2xl bg-gray-50 flex items-center justify-center relative mb-6">
                            <div className="text-gray-200 group-hover:scale-110 group-hover:text-gray-300 transition-all">
                               {React.cloneElement(content.icon as React.ReactElement, { className: "h-16 w-16" })}
                            </div>
                            <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 text-[10px] font-black uppercase text-gray-500">
                               {item.badge}
                            </span>
                         </div>
                         
                         <h3 className="text-[19px] font-black text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                         <p className="text-[14px] font-medium text-gray-500 line-clamp-2">{item.info}</p>
                         
                         <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-5">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400">
                               <Clock className="h-4 w-4" /> {item.duration}
                            </div>
                            <button className="flex items-center gap-2 text-[13px] font-black text-gray-900 hover:text-blue-600 transition-colors">
                               Access <ArrowRight className="h-4 w-4" />
                            </button>
                         </div>
                      </div>
                   </FadeUp>
                 ))}
              </div>
              
              <div className="mt-20 text-center">
                 <button className="px-10 py-4 rounded-2xl border-2 border-gray-100 text-[14px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all">
                    Load More Resources
                 </button>
              </div>
           </div>
        </section>

        {/* ── Subdued CTA ── */}
        <section className="border-t border-gray-100 bg-gray-50 py-20 sm:py-24 xl:py-28">
           <div className="landing-shell-narrow text-center">
              <FadeUp>
                 <div className="mb-8 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-100 text-blue-600 shadow-sm">
                       <Brain className="h-8 w-8" />
                    </div>
                 </div>
                 <h2 className="landing-title-section text-gray-900">Need a study plan?</h2>
                 <p className="mt-6 text-gray-500 text-[18px] font-medium max-w-2xl mx-auto">
                    Let our AI Assistant help you find the best resources based on your recent performance and goals.
                 </p>
                 <button className="mt-10 px-10 py-5 rounded-2xl bg-gray-900 text-white text-[15px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                    Start AI Prep
                 </button>
              </FadeUp>
           </div>
        </section>

      </main>
    </LandingLayout>
  );
}

/* ── Inline Icons for simplicity ── */
function Target(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
