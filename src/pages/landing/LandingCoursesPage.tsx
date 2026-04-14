import { motion } from "framer-motion";
import { 
  GraduationCap, Search, Play, 
  ChevronDown, BookOpen, Star, 
  Target, Sparkles, Filter
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { B, P, T, grad, gText, SG, TYPO, BG_AERO, BG_STUDIO } from "@/components/landing/DesignTokens";

/* ── Asset Paths ── */
const physicsThumb = "/assets/physics_video.png";
const biologyThumb = "/assets/biology_video.png";
const generalThumb = "/assets/jee_neet.png";

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

const courseCategories = [
  { id: "jee", name: "IIT JEE", icon: "⚛️", color: B },
  { id: "neet", name: "NEET UG", icon: "🩺", color: "#EF4444" },
  { id: "foundation", name: "Foundation (9-10)", icon: "🎒", color: T },
  { id: "boards", name: "School Boards", icon: "🎓", color: P },
];

const allCourses = [
  { id: 1, name: "Physics — Wave Optics Masterclass", category: "jee", exam: "JEE 2025", duration: "1h 45m", rating: 4.8, students: "12K", thumb: physicsThumb, instructor: "Dr. Anil Kumar", color: B, isLive: true },
  { id: 2, name: "Advanced Organic Chemistry", category: "neet", exam: "NEET 2025", duration: "2h 15m", rating: 4.9, students: "18K", thumb: generalThumb, instructor: "Prof. Sunita Rao", color: "#EF4444" },
  { id: 3, name: "Human Physiology - Neural Control", category: "neet", exam: "NEET AIIMS", duration: "3h 10m", rating: 4.7, students: "14K", thumb: biologyThumb, instructor: "Dr. Meena Sharma", color: T, isLive: true },
  { id: 4, name: "Calculus - Integration Level 3", category: "jee", exam: "JEE Advanced", duration: "1h 30m", rating: 4.6, students: "9K", thumb: generalThumb, instructor: "Dr. Prabhas Nair", color: P },
  { id: 5, name: "Class 10th Math Foundation", category: "foundation", exam: "Class 10", duration: "45m", rating: 4.9, students: "20K", thumb: generalThumb, instructor: "Kavitha Reddy", color: "#F59E0B" },
  { id: 6, name: "Computer Science - Python Basics", category: "boards", exam: "Class 12", duration: "2h 00m", rating: 4.5, students: "7K", thumb: generalThumb, instructor: "Vikram Seth", color: "#6366F1" },
];

export default function LandingCoursesPage() {
  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased" style={{ background: BG_STUDIO }}>
      <LandingNavbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: SG }} />
          <div className="landing-shell text-center">
            <FadeUp>
              <h1 className={TYPO.h1}>
                Explore our <span style={gText()}>Mastery Courses.</span>
              </h1>
              <p className={TYPO.p + " mx-auto max-w-2xl mt-8"}>
                Premium AI-powered courses designed to help you master every subject and crack your dream exams.
              </p>

              {/* Search Bar */}
              <div className="mx-auto max-w-2xl relative mb-16">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search for courses, subjects or instructors..." 
                  className="h-14 w-full rounded-[2rem] border border-gray-100 bg-white/60 pl-14 pr-5 text-gray-900 shadow-2xl backdrop-blur-xl outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:h-16 sm:pl-16 sm:pr-6"
                />
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Course Grid ── */}
        <section className="landing-section bg-white">
          <div className="landing-shell">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 pb-8 border-b border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">
                <button className="rounded-full px-6 py-2 bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  All Courses
                </button>
                {courseCategories.map((cat) => (
                  <button key={cat.id} className="whitespace-nowrap rounded-full px-6 py-2 border border-gray-100 bg-white text-gray-500 font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95">
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm self-end">
                <Filter className="h-4 w-4" /> Filter By Rank
              </button>
            </div>

            {/* Courses List */}
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {allCourses.map((course, i) => (
                <FadeUp key={course.id} delay={i * 0.05}>
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="overflow-hidden rounded-[2.5rem] bg-white transition-all duration-500 group cursor-pointer"
                  >
                    {/* VIDEO THUMBNAIL UI */}
                    <div className="relative aspect-video overflow-hidden rounded-[2.5rem] shadow-2xl">
                      <img 
                        src={course.thumb} 
                        alt={course.name} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      {/* Overlays */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-gray-950 shadow-[0_0_50px_rgba(255,255,255,0.4)] scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="h-7 w-7 fill-current translate-x-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute left-4 top-4 flex gap-2">
                        {course.isLive && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-[10px] uppercase font-black text-white shadow-lg animate-pulse">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                          </div>
                        )}
                        <div className="rounded-lg bg-white/20 px-3 py-1 text-[10px] uppercase font-black text-gray-900 backdrop-blur-md border border-gray-200">
                          {course.exam}
                        </div>
                      </div>

                      {/* Bottom duration */}
                      <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                        {course.duration}
                      </div>
                    </div>

                    <div className="pt-6 px-2">
                       <h3 className={TYPO.cardTitle + " group-hover:text-blue-600 transition-colors mb-2"}>
                          {course.name}
                       </h3>
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                               <div className="h-full w-full bg-slate-200" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">{course.instructor}</span>
                         </div>
                         <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600 border border-blue-100">
                            <Star className="h-3.5 w-3.5 fill-current" /> {course.rating}
                         </div>
                      </div>

                      <div className="mt-6 flex items-center gap-4 border-t border-gray-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{course.students} Students Joined</span>
                         <div className="h-1 w-1 rounded-full bg-gray-300" />
                         <span className="text-[12px] font-black text-blue-600 uppercase tracking-widest">Enroll Now</span>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="landing-section bg-slate-50">
          <div className="landing-shell-narrow text-center">
            <FadeUp>
              <h2 className={TYPO.h2 + " mb-12"}>Frequently Asked Questions</h2>
              <div className="space-y-4 text-left">
                {[
                  "How does the AI personalization work?",
                  "Can I access courses offline?",
                  "Is there a free trial for premium courses?",
                  "Will I get a certificate after completion?"
                ].map((q, i) => (
                  <div key={i} className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">{q}</span>
                      <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-hover:rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
