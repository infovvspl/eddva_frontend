import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import MD from "../../../assets/md.png";
import A1 from "../../../assets/img1.png";
import A2 from "../../../assets/img2.png";
import A3 from "../../../assets/img3.png";
import A4 from "../../../assets/img4.png";
import A5 from "../../../assets/img5.png";
import A6 from "../../../assets/img6.png";

// ─── Shared ease tuple configuration ──────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const;

// Interface exactly mapping the explicit object signature required by your system layout
interface TeamMember {
  name: string;
  role: string;
  detail: string;
  accent: string;
  photo: string;
}

const aboutPageTeamMembers: TeamMember[] = [
  {
    name: "Ankit Tripathi",
    role: "Additional Director",
    detail: "Former Principal Engineer at a Fortune 500. Built Eddva to democratize elite-level technical education.",
    photo: A2,
    accent: "bg-blue-50 text-[#0066cc] border-blue-100",
  },
  {
    name: "Ayush Kumar Dubey",
    role: "Senior JEE educator",
    detail: "Ex-Google educator with 12 years designing learning systems that scale from 10 to 10 million students.",
    photo: A1,
    accent: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    name: "Priyanka SV",
    role: "Marketing Head",
    detail: "Full-stack architect obsessed with building learning experiences that feel as smooth as they are powerful.",
    photo: A3,
    accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    name: "Subham Mishra",
    role: "Full-Stack AI/ML Developer",
    detail: "Former Principal Engineer at a Fortune 500. Built Eddva to democratize elite-level technical education.",
    photo: A6,
    accent: "bg-blue-50 text-[#0066cc] border-blue-100",
  },
  {
    name: "Akankshya Kar",
    role: "AI/ML Developer",
    detail: "Ex-Google educator with 12 years designing learning systems that scale from 10 to 10 million students.",
    photo: A5,
    accent: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    name: "Bhagyashree Sendh",
    role: "Full-Stack Developer",
    detail: "Full-stack architect obsessed with building learning experiences that feel as smooth as they are powerful.",
    photo: A4,
    accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Maintained state hook signature for layout flexibility
  const [, setActiveTab] = useState<number>(0);

  return (
    <main className="w-full bg-white text-slate-900 overflow-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex overflow-hidden bg-slate-950"
      >
        {/* Left panel — text */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pt-28 pb-16 w-full lg:w-1/2"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-8"
          >
            A new standard
            <br />
            <span className="font-spicy bg-gradient-to-r from-[#0066cc] via-[#00a6ff] to-cyan-300 bg-clip-text text-transparent">
              in learning.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed max-w-3xl mb-10 font-medium"
          >
            Eddva exists at the intersection of intelligence and intention. We
            are redefining learning as an experience that is not only
            effective—but elevated. Moving beyond outdated systems, we offer an
            environment where understanding is deep, progress is deliberate, and
            growth is inevitable. Our philosophy is simple: Learning should be
            as refined as the ambitions it serves. This is why Eddva is designed
            to adapt, evolve, and respond to you—creating a seamless flow of
            knowledge that aligns with your pace and sharpens your thinking.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed max-w-3xl mb-10 font-medium"
          >
            Here, learning is not passive. It is precise. Purposeful.
            Transformative. This is not traditional education. This is
            intelligent mastery.
          </motion.p>
        </motion.div>

        {/* Right panel — image mosaic */}
        <div className="hidden lg:block absolute right-0 top-0 w-1/2 h-full overflow-hidden">
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-slate-950 to-transparent z-10" />
          <div className="absolute inset-0 bg-slate-950/30 z-10" />

          {/* Mosaic grid */}
          <div className="grid grid-cols-2 grid-rows-3 gap-2 h-full p-2">
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.2 }}
              className="row-span-2 rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600"
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.35 }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600"
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.5 }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=600"
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.4 }}
              className="col-span-2 rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 text-slate-600 text-xs font-semibold tracking-widest uppercase z-20"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-transparent to-slate-600"
          />
          Scroll
        </motion.div>
      </section>

      {/* Founder's Message Section */}
      <section className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-white">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#0066cc]/40 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* LEFT: Content Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease }}
              className="lg:col-span-7 space-y-8"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                Built on discipline.{" "}
                <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                  Driven by vision.
                </span>
              </h2>

              <div className="text-slate-500 font-medium leading-relaxed text-base space-y-4">
                <p>
                  Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee, embodies a
                  legacy of discipline, leadership, and purpose. From serving
                  the nation with distinction to building Port Translogistics
                  Pvt. Ltd. into a respected enterprise, his journey reflects a
                  relentless pursuit of excellence.
                </p>
                <p>
                  Yet, beyond achievement, he recognized a deeper gap—a learning
                  system that lacked adaptability, depth, and true
                  understanding.
                </p>
                <p>
                  He envisioned something better: a platform that doesn’t just
                  deliver information, but interprets, adapts, and empowers.
                </p>
                <p>
                  Eddva was born from that vision—a refined learning ecosystem
                  designed for those who refuse to settle for conventional
                  paths.
                </p>
                <p>
                  Because true growth is not about access to knowledge—it is
                  about mastering it with clarity and intent.
                </p>
              </div>
            </motion.div>

            {/* RIGHT: Founder Image Column */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease, delay: 0.15 }}
              className="lg:col-span-5 relative flex justify-center lg:justify-end"
            >
              <div className="absolute -inset-6 bg-gradient-to-tr from-cyan-400/20 via-blue-500/10 to-purple-500/20 blur-3xl rounded-full opacity-70" />
              <div className="absolute top-6 -left-4 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-10 -right-4 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />

              <motion.div
                whileHover={{
                  y: -8,
                  rotateX: 2,
                  rotateY: -2,
                }}
                transition={{ type: "spring", stiffness: 180 }}
                className="group relative w-full max-w-md aspect-[4/5]"
                style={{ perspective: 1000 }}
              >
                <div className="absolute inset-0 rounded-[28px] p-[1.5px]">
                  <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20">
                    <img
                      src={MD}
                      alt="Eddva Founder"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700">
                      <div className="absolute -left-40 top-0 h-full w-24 rotate-12 bg-white/20 blur-xl transform translate-x-[500px] transition-transform duration-1000 group-hover:translate-x-[900px]" />
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] border border-white/20 rounded-2xl px-5 py-4 shadow-xl">
                        <p className="text-white text-sm md:text-base font-semibold text-center tracking-wide">
                          Lt. Col. Anil Tripathi (Retd.)
                        </p>
                        <p className="text-white text-xs md:text-sm text-center mt-1 tracking-wider uppercase">
                          Sena Medal Awardee
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-50 to-transparent rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Where expertise meets{" "}
                <span className="font-spicy block bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                  innovation.
                </span>
              </h2>
            </div>
            <p className="text-slate-400 font-medium max-w-xs text-sm leading-relaxed sm:text-right">
              Eddva is shaped by a collective of educators, technologists, and
              visionaries - each committed to delivering excellence at every
              layer of the experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {aboutPageTeamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease, delay: i * 0.12 }}
                className="flex flex-col items-center text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Profile Image Frame referencing mapped .photo property structure */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {member.name}
                </h3>

                <p className="mt-1 text-sm font-medium text-[#0066cc]">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-white border-t border-slate-100">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50/60 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
              className="lg:col-span-7"
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
                Your next chapter
                <br />
                <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                  starts here.
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="lg:col-span-5 space-y-6"
            >
              <p className="text-slate-500 font-medium leading-relaxed text-lg">
                Join 50,000+ learners who chose to invest in themselves. Secure
                your seat in our next cohort and start building the career you
                actually want.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Get Instant Access</span>
                  <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>

                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:border-[#0066cc]/40 hover:text-slate-900 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-md"
                >
                  <FiTrendingUp className="w-4 h-4" />
                  View Courses
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                14-day money-back guarantee. No questions asked.
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}