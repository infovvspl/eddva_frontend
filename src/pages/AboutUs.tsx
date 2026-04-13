import React, { useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { FadeUp, Label, HeroBadge } from "@/components/landing/LandingPrimitives";
import { motion } from "framer-motion";
import { 
  Users, Award, TrendingUp, Lightbulb, Rocket, Target, 
  Linkedin, Mail, PlayCircle, Globe, Sparkles, Star, Bot, Check
} from "lucide-react";
import { B, P, T } from "@/components/landing/DesignTokens";
import heroImg   from "@/assets/education-learning-study-concept-apacity-development-training-personal-development-mixed-media-business_1085052-1781.avif";
import cultureImg from "@/assets/chalkboard-with-learn-explore-discover-create-education-concept_1296762-4420.jpg";

const timeline = [
  { year: "2022", title: "The Idea 💡", desc: "Started with a vision to make premium education accessible to every Indian household using AI.", icon: <Lightbulb className="h-6 w-6 text-blue-600" /> },
  { year: "2023", title: "The Build 🚀", desc: "Engineered our proprietary neural assessment engine and launched the first series of JEE/NEET modules.", icon: <Rocket className="h-6 w-6 text-purple-600" /> },
  { year: "2024", title: "Growth 📈", desc: "Reached 50,000+ active learners and achieved a 92% student satisfaction rate across North India.", icon: <TrendingUp className="h-6 w-6 text-emerald-600" /> },
  { year: "2025", title: "The Future 🔮", desc: "Developing immersive virtual classrooms and personalized mentor bots for real-time 1-on-1 tutoring.", icon: <Globe className="h-6 w-6 text-yellow-600" /> },
];

const values = [
  { title: "Student First", desc: "Every decision starts with: 'How does this help a student score 1% more?'", icon: "💎", color: B },
  { title: "Innovation", desc: "Using cutting-edge AI to personalize every single learning path.", icon: "🌌", color: P },
  { title: "Accessibility", desc: "Premium content at prices that don't burden families.", icon: "🕊️", color: T },
  { title: "Excellence", desc: "We don't aim for 'good'. We aim for 'Rank 1'.", icon: "🏆", color: "#F59E0B" }
];

const team = [
  { name: "Rahul Sharma", role: "CEO & Founder", bio: "Ex-IITian with a passion for ed-tech innovation.", image: "https://i.pravatar.cc/300?img=68", isFounder: true },
  { name: "Ananya Iyer", role: "Head of Content", bio: "Leading our team of 50+ curriculum designers.", image: "https://i.pravatar.cc/300?img=45" },
  { name: "Dr. Vikram Seth", role: "AI Research", bio: "PhD in Machine Learning from Stanford.", image: "https://i.pravatar.cc/300?img=32" },
  { name: "Sneha Kapur", role: "Student Success", bio: "Ensuring every learner reaches their full potential.", image: "https://i.pravatar.cc/300?img=47" },
];

export default function AboutUs() {
  return (
    <LandingLayout>
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden py-24 pb-48">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-16 lg:grid lg:grid-cols-2 lg:text-left">
            <FadeUp>
              <Label color="blue">Our Mission</Label>
              <h1 className="mt-8 text-[48px] font-extrabold leading-[1.1] tracking-tight text-gray-900 lg:text-[64px]">
                Building the <span style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Future of Learning</span>
              </h1>
              <p className="mt-8 text-[20px] font-medium leading-relaxed text-gray-500">
                At EDDVA, we believe that education is not one-size-fits-all. We are leveraging AI to create personalized educational experiences that adapt to every student's pace, style, and dreams.
              </p>
              
              <div className="mt-12 flex flex-wrap gap-8">
                 <div className="text-center sm:text-left">
                    <p className="text-[32px] font-black text-gray-900">1.2M+</p>
                    <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">Global Learners</p>
                 </div>
                 <div className="text-center sm:text-left">
                    <p className="text-[32px] font-black text-gray-900">50K+</p>
                    <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">Total Selections</p>
                 </div>
              </div>
            </FadeUp>

            <div className="relative flex justify-center">
              <div className="relative h-[400px] w-full max-w-md overflow-hidden rounded-[32px] shadow-2xl">
                 <img src={heroImg} className="h-full w-full object-cover" alt="Education at EDDVA" />
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
              </div>
              
              {/* Floating badges */}
              <div className="absolute -left-8 top-12 z-20 flex animate-bounce items-center gap-3 rounded-2xl bg-white p-4 shadow-xl">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Star className="h-5 w-5" /></div>
                 <div>
                    <p className="text-[13px] font-black text-gray-900">4.9/5 Rating</p>
                    <p className="text-[10px] text-gray-400">Student Feedback</p>
                 </div>
              </div>
              
              <div className="absolute -right-4 bottom-12 z-20 flex animate-pulse items-center gap-3 rounded-2xl bg-white p-4 shadow-xl">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Award className="h-5 w-5" /></div>
                 <div>
                    <p className="text-[13px] font-black text-gray-900">92% Pass Rate</p>
                    <p className="text-[10px] text-gray-400">Competitive Exams</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STORY TIMELINE ─── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-20 text-center">
             <h2 className="text-[36px] font-black tracking-tight text-gray-900">Our Journey So Far</h2>
             <p className="mt-4 text-gray-500 font-medium">How we transformed from an idea to India's fastest growing EdTech platform.</p>
          </FadeUp>

          <div className="relative">
             {/* Dynamic timeline line */}
             <div className="absolute left-[20px] top-0 h-full w-0.5 bg-gray-100 lg:left-1/2 lg:-translate-x-1/2" />
             
             <div className="space-y-16">
                {timeline.map((item, i) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className={`relative flex flex-col items-center gap-8 lg:flex-row ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
                      <div className="flex w-full lg:w-1/2">
                        <div className={`flex flex-col rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md ${i % 2 === 0 ? "lg:mr-12 lg:text-right lg:items-end" : "lg:ml-12"}`}>
                          <span className="text-[14px] font-black text-gray-400 mb-2">{item.year}</span>
                          <h4 className="text-[22px] font-black text-gray-900 mb-4">{item.title}</h4>
                          <p className="text-[15px] font-medium leading-relaxed text-gray-500">{item.desc}</p>
                        </div>
                      </div>

                      {/* Central icon */}
                      <div className="absolute left-[-2px] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl lg:left-1/2 lg:-translate-x-1/2">
                         {item.icon}
                      </div>

                      <div className="hidden w-1/2 lg:block" />
                    </div>
                  </FadeUp>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* ─── MISSION & VISION ─── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <FadeUp>
              <div className="h-full rounded-[40px] border border-white bg-white/60 p-10 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="mb-6 text-[28px] font-black text-gray-900">Our Mission</h3>
                <p className="text-[17px] font-medium leading-relaxed text-gray-500">
                  To democratize high-end education by building an AI-first operating system for learning that understands each student's unique DNA and optimizes their path to success.
                </p>
                <ul className="mt-8 space-y-4">
                  {["Hyper-personalized paths", "Accessible to everyone", "Results-driven mindset"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[15px] font-bold text-gray-700">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="h-3 w-3" /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="h-full rounded-[40px] border border-white bg-white/60 p-10 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                   <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="mb-6 text-[28px] font-black text-gray-900">Our Vision</h3>
                <p className="text-[17px] font-medium leading-relaxed text-gray-500">
                  By 2030, we aim to be the cognitive partner for 10 million students, bridging the gap between potential and accomplishment through the power of human-centered AI.
                </p>
                <div className="mt-10 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                   <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"><Globe className="h-6 w-6" /></div>
                      <p className="text-[14px] font-black text-gray-900">Expanding to Global Markets 🌏</p>
                   </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ─── TEAM SECTION ─── */}

      {/* ─── TEAM SECTION ─── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-20 text-center">
             <Label color="teal">The Minds Behind EDDVA</Label>
             <h2 className="mt-6 text-[36px] font-black tracking-tight text-gray-900">Meet Our Dream Team</h2>
          </FadeUp>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
             {team.map((member, i) => (
               <FadeUp key={i} delay={i * 0.1}>
                  <div className={`relative group flex flex-col items-center rounded-[32px] border border-white bg-white p-8 text-center shadow-sm transition-all hover:bg-gray-900 hover:text-white
                    ${member.isFounder ? "lg:col-span-2 lg:flex-row lg:text-left animate-pulse border-blue-100" : ""}`}>
                    
                    <div className={`relative mb-6 ${member.isFounder ? "lg:mb-0 lg:mr-10" : ""}`}>
                       <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg lg:h-32 lg:w-32">
                          <img src={member.image} className="h-full w-full object-cover" alt={member.name} />
                       </div>
                       {member.isFounder && (
                         <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                            <Sparkles className="h-4 w-4" />
                         </div>
                       )}
                    </div>

                    <div className="flex-1">
                       <h4 className="text-[18px] font-black">{member.name}</h4>
                       <p className={`mb-4 text-[13px] font-bold ${member.isFounder ? "text-blue-500" : "text-gray-400 group-hover:text-gray-400 transition-colors"}`}>{member.role}</p>
                       <p className="mb-6 text-[14px] font-medium leading-relaxed opacity-60">{member.bio}</p>
                       
                       <div className="flex justify-center gap-4 lg:justify-start">
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors group-hover:bg-white/10 hover:text-blue-500">
                             <Linkedin className="h-4 w-4" />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors group-hover:bg-white/10 hover:text-blue-500">
                             <Mail className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                  </div>
               </FadeUp>
             ))}
          </div>
        </div>
      </section>

      {/* ─── CULTURE VIDEO ─── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="relative overflow-hidden rounded-[48px] bg-gray-900 aspect-video">
             <img src={cultureImg} className="h-full w-full object-cover opacity-60" alt="Learn Explore Discover Create" />
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-gray-900 backdrop-blur-xl border border-white/40"
                >
                   <PlayCircle className="h-12 w-12" />
                </motion.button>
                <h3 className="text-[32px] font-black text-white">Behind The Scenes</h3>
                <p className="text-white/60 font-medium">Experience the culture of India's most innovative AI lab.</p>
             </div>
          </FadeUp>
        </div>
      </section>
      
    </LandingLayout>
  );
}
