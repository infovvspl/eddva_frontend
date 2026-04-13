import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, CheckCircle2, 
  ExternalLink, ArrowRight,
  Clock, MapPin, Search, Filter,
  Sparkles, Award, Star
} from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { B, P, T, gText, SG, TYPO, BG_STUDIO } from "@/components/landing/DesignTokens";
import { FadeUp } from "@/components/landing/LandingPrimitives";
import bannerImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";

/* ── Minimal Exam Data ── */
const exams = [
  { 
    id: "jee-mains-1", 
    name: "JEE Mains (Session 1)", 
    date: "Jan 24 - Feb 1, 2025", 
    regEnd: "Dec 4, 2024", 
    status: "Upcoming",
    icon: <Sparkles className="h-5 w-5" />,
    color: B,
    daysLeft: "42 Days"
  },
  { 
    id: "neet-2025", 
    name: "NEET UG 2025", 
    date: "May 4, 2025", 
    regEnd: "Mar 16, 2025", 
    status: "Not Started",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "#EF4444",
    daysLeft: "150 Days"
  },
  { 
    id: "jee-adv-2025", 
    name: "JEE Advanced 2025", 
    date: "May 25, 2025", 
    regEnd: "May 7, 2025", 
    status: "Active",
    icon: <Star className="h-5 w-5" />,
    color: P,
    daysLeft: "170 Days"
  },
  { 
    id: "cuet-2025", 
    name: "CUET UG 2025", 
    date: "May 15 - May 31, 2025", 
    regEnd: "Mar 26, 2025", 
    status: "Active",
    icon: <Award className="h-5 w-5" />,
    color: T,
    daysLeft: "160 Days"
  },
];

export default function ExamsRegistrationPage() {
  return (
    <LandingLayout>
      <main className="min-h-screen pt-20" style={{ background: BG_STUDIO }}>
        
        {/* ── Minimal Hero with Banner ── */}
        <section className="relative overflow-hidden py-32 lg:py-48 text-center border-b border-gray-50">
           {/* Background Image with Overlay */}
           <div className="absolute inset-0 -z-10 bg-slate-950">
              <img src={bannerImg} alt="Exams Info" className="h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, ${BG_STUDIO})` }} />
           </div>
           
           <div className="mx-auto max-w-4xl px-6 relative z-10">
              <FadeUp>
                 <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 backdrop-blur-sm">
                       <Clock className="h-4 w-4 text-blue-600" />
                       <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Exam Tracker 2025</span>
                    </div>
                 </div>
                 <h1 className="text-[44px] lg:text-[60px] font-black tracking-tight text-gray-900 leading-[1.1]">
                    Upcoming <br/>
                    <span style={gText()}>National Exams.</span>
                 </h1>
                 <p className={TYPO.p + " mt-8 text-lg font-medium mx-auto max-w-2xl"}>
                    Stay ahead of the curve. Track registration deadlines, exam dates, and official portals for all major entrance exams in one simple dashboard.
                 </p>
              </FadeUp>
           </div>
        </section>

        {/* ── Filter Bar ── */}
        <section className="sticky top-20 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
           <div className="mx-auto max-w-7xl px-6 h-18 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <button className="text-[14px] font-black text-gray-900 border-b-2 border-gray-900 pb-1">All Exams</button>
                 <button className="text-[14px] font-bold text-gray-400 hover:text-gray-900">Engineering</button>
                 <button className="text-[14px] font-bold text-gray-400 hover:text-gray-900">Medical</button>
                 <button className="text-[14px] font-bold text-gray-400 hover:text-gray-900">University</button>
              </div>
              
              <div className="hidden md:flex items-center gap-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                       type="text" 
                       placeholder="Search exams..." 
                       className="h-10 w-64 rounded-xl border border-gray-100 bg-white pl-10 pr-4 text-[13px] font-bold outline-none focus:border-blue-500 transition-all"
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* ── Exam Timeline Grid ── */}
        <section className="py-24">
           <div className="mx-auto max-w-7xl px-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 {exams.map((exam, i) => (
                   <FadeUp key={exam.id} delay={i * 0.05}>
                      <div className="group relative rounded-3xl border border-gray-100 bg-white p-8 transition-all hover:shadow-xl hover:border-gray-200">
                         {/* Header */}
                         <div className="mb-8 flex items-start justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-900 group-hover:scale-110 transition-transform" style={{ color: exam.color }}>
                               {exam.icon}
                            </div>
                            <span className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest
                               ${exam.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                               {exam.status}
                            </span>
                         </div>
                         
                         <h3 className="text-[22px] font-black text-gray-900 mb-6 leading-tight group-hover:text-blue-600 transition-colors">{exam.name}</h3>
                         
                         {/* Details */}
                         <div className="space-y-4 mb-10">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-[13px] font-bold">Exam Date</span>
                               </div>
                               <span className="text-[13px] font-extrabold text-gray-900">{exam.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-gray-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-[13px] font-bold">Reg. Deadline</span>
                               </div>
                               <span className="text-[13px] font-extrabold text-red-500">{exam.regEnd}</span>
                            </div>
                         </div>
                         
                         {/* Actions */}
                         <div className="flex items-center gap-3">
                            <button className="flex-1 rounded-2xl bg-gray-900 px-6 py-4 text-[13px] font-black uppercase tracking-widest text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                               Register
                            </button>
                            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all">
                               <ExternalLink className="h-5 w-5" />
                            </button>
                         </div>
                      </div>
                   </FadeUp>
                 ))}
              </div>
              
              <div className="mt-24 text-center">
                 <p className="text-[13px] font-bold text-gray-400 mb-8 uppercase tracking-widest">More exams being added hourly</p>
                 <button className="px-10 py-5 rounded-2xl border-2 border-gray-100 text-[14px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all">
                    View Complete Calendar
                 </button>
              </div>
           </div>
        </section>

        {/* ── Subdued Minimal CTA ── */}
        <section className="bg-gray-50 py-32 border-t border-gray-100">
           <div className="mx-auto max-w-3xl px-6 text-center">
              <FadeUp>
                 <div className="mb-10 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-gray-100 shadow-sm">
                       <ArrowRight className="h-8 w-8 text-blue-600" />
                    </div>
                 </div>
                 <h2 className="text-[32px] lg:text-[40px] font-black text-gray-900 tracking-tight">Need Exam Preparation?</h2>
                 <p className="mt-6 text-gray-500 text-lg font-medium leading-relaxed">
                    Once you've registered, navigate to our <Link to="/courses" className="text-blue-600 underline">Courses</Link> or <Link to="/study-material" className="text-blue-600 underline">Study Material</Link> hub to start your journey.
                 </p>
              </FadeUp>
           </div>
        </section>

      </main>
    </LandingLayout>
  );
}
