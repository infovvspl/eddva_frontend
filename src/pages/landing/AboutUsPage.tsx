import { 
  Users, Target, Award, Heart, 
  ChevronRight, Sparkles, Brain, 
  MessageCircle, Rocket
} from "lucide-react";
import { motion } from "framer-motion";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { B, P, T, grad, gText, SG, TYPO, BG_STUDIO } from "@/components/landing/DesignTokens";
import bannerImg  from "@/assets/chalkboard-with-learn-explore-discover-create-education-concept_1296762-4420.jpg";
import eduImg    from "@/assets/education-learning-study-concept-apacity-development-training-personal-development-mixed-media-business_1085052-1781.avif";


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

export default function AboutUsPage() {
  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased" style={{ background: BG_STUDIO }}>
      <LandingNavbar />

      <main>
        {/* ══ HERO BANNER ══ */}
        <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
          {/* full-bleed banner image */}
          <img
            src={bannerImg}
            alt="About EDDVA — Learn Explore Discover Create"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* layered overlay: dark left → transparent right */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(110deg, rgba(3,10,28,0.88) 0%, rgba(3,10,28,0.65) 55%, rgba(3,10,28,0.35) 100%)" }}
          />
          {/* bottom fade into page bg */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: `linear-gradient(to bottom, transparent, ${BG_STUDIO})` }}
          />

          {/* content */}
          <div className="relative z-10 flex h-full items-center">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
              <FadeUp>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/80 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" /> About EDDVA
                </span>
                <h1 className="mb-5 text-[46px] font-extrabold leading-[1.1] tracking-tight text-white lg:text-[64px]">
                  Learn · Explore<br />
                  <span style={{ background:"linear-gradient(135deg,#60A5FA,#A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                    Discover · Create
                  </span>
                </h1>
                <p className="mb-10 max-w-lg text-[17px] font-medium leading-relaxed text-white/65">
                  At EDDVA, we blend advanced AI with deep pedagogical expertise to create a learning experience that's as unique as every student.
                </p>
                {/* stat chips */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { icon:<Users className="h-4 w-4" />,   val:"1.2M+",  label:"Active Learners" },
                    { icon:<Target className="h-4 w-4" />,  val:"98%",    label:"Satisfaction Rate" },
                    { icon:<Award className="h-4 w-4" />,   val:"50K+",   label:"Exam Toppers" },
                    { icon:<Heart className="h-4 w-4" />,   val:"Since 2020", label:"Trusted in India" },
                  ].map(s => (
                    <div key={s.label}
                      className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                      <span className="text-white/60">{s.icon}</span>
                      <div>
                        <p className="text-[15px] font-extrabold text-white leading-none">{s.val}</p>
                        <p className="text-[10px] font-semibold text-white/50 mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── Education Visual Banner ── */}
        <section className="bg-white pt-16 pb-0">
          <div className="mx-auto max-w-7xl px-5">
            <FadeUp>
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={eduImg}
                  alt="Education Learning Study"
                  className="h-[320px] w-full object-cover object-center lg:h-[420px]"
                />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(90deg, rgba(3,10,28,0.82) 0%, rgba(3,10,28,0.45) 55%, rgba(3,10,28,0.15) 100%)" }} />
                <div className="absolute inset-0 flex items-center px-8 lg:px-14">
                  <div className="max-w-xl">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/50">Our Philosophy</p>
                    <h2 className="mb-4 text-[28px] font-extrabold leading-tight text-white lg:text-[38px]">
                      Education is not the filling of a pail,<br />
                      <span style={{ background:"linear-gradient(135deg,#60A5FA,#A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                        but the lighting of a fire.
                      </span>
                    </h2>
                    <p className="text-[14px] font-medium text-white/60">
                      Capacity development · Training · Personal growth · Mixed-media learning — all in one platform.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {[
                        { val:"20+", label:"Exam Categories" },
                        { val:"500+", label:"Expert Educators" },
                        { val:"5M+", label:"Study Hours Logged" },
                      ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                          <span className="text-[16px] font-extrabold text-white">{s.val} </span>
                          <span className="text-[12px] text-white/55">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Mission & Vision ── */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid gap-12 lg:grid-cols-2">
              <FadeUp>
                <div className="h-full rounded-[2.5rem] bg-slate-50 p-10 lg:p-14 border border-slate-100 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                  <div>
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg group-hover:rotate-6 transition-transform">
                      <Target className="h-8 w-8" />
                    </div>
                    <h2 className={TYPO.h2}>Our Mission</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                      To bridge the gap between traditional classroom learning and modern digital needs by providing high-quality, AI-personalized study paths accessible to every student, everywhere.
                    </p>
                  </div>
                  <div className="mt-12 flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gray-200" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-400">Trusted by 50K+ Students</span>
                  </div>
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="h-full rounded-[2.5rem] bg-indigo-50 p-10 lg:p-14 border border-indigo-100 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                  <div>
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg group-hover:-rotate-6 transition-transform">
                      <Rocket className="h-8 w-8" />
                    </div>
                    <h2 className={TYPO.h2}>Our Vision</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                      We envision a future where every student in India has a personal AI mentor that understands their unique learning style, helping them unlock their full potential and achieve their dreams.
                    </p>
                  </div>
                  <div className="mt-12">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 backdrop-blur-sm">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="text-sm font-bold text-indigo-900 italic lowercase">Made with love in India</span>
                    </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── Core Values ── */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 relative z-10">
            <div className="mb-16 text-center">
              <FadeUp>
                <h2 className={TYPO.h2 + " mb-4"}>
                  Values that <span style={gText()}>Drive Us</span>
                </h2>
                <p className="text-gray-500 font-medium">The principles behind every feature we build.</p>
              </FadeUp>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Student First", icon: Heart, color: "#EF4444", desc: "Every decision is made with the student's success in mind." },
                { title: "Innovation", icon: Brain, color: B, desc: "We push the boundaries of EdTech with AI-driven insights." },
                { title: "Accessibility", icon: Users, color: T, desc: "Quality education should be affordable and reachable." },
                { title: "Excellence", icon: Award, color: P, desc: "We strive for the highest standards in content and technology." },
              ].map((value, i) => (
                <FadeUp key={value.title} delay={i * 0.1}>
                  <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl transition-all h-full">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: value.color + '15', color: value.color }}>
                      <value.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-extrabold mb-3">{value.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{value.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Join the Journey ── */}
        <section className="py-24 bg-white text-center">
          <div className="mx-auto max-w-4xl px-5">
            <FadeUp>
              <div className="mb-10 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gray-900 text-white shadow-2xl relative">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 animate-pulse" />
                  <MessageCircle className="h-10 w-10 relative z-10" />
                </div>
              </div>
              <h2 className={TYPO.h1 + " mb-6"}>
                Be Part of the <span style={gText()}>Future.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto font-medium">
                Whether you're a student, parent, or educator, we're building the future of learning together. Join our community today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="rounded-2xl px-10 py-4 font-bold text-white shadow-xl"
                  style={{ background: grad() }}>
                  Join as a Student
                </motion.button>
                <button className="rounded-2xl border-2 border-slate-200 px-10 py-4 font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  Contact Us
                </button>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
