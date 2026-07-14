import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiShield,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

interface FormState {
  name: string;
  email: string;
  department: "school" | "coaching";
  subject: string;
  message: string;
}

export default function Contact() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    department: "school",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDeptSelect = (dept: "school" | "coaching") => {
    setFormData({ ...formData, department: dept });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: "", email: "", department: "school", subject: "", message: "" });

    // Clear success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <LandingLayout>
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
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease }}
              className="flex items-center gap-3 mb-8"
            >
              <span className="h-px w-10 bg-[#0066cc]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#0066cc] uppercase">
                Contact Us
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-8"
            >
              Have Questions?
              <br />
              <span className="font-spicy bg-gradient-to-r from-[#0066cc] via-[#00a6ff] to-cyan-300 bg-clip-text text-transparent">
                We're Here to Help.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed max-w-md mb-10 font-medium"
            >
              We love building partnerships, guiding future students, and
              discussing career trajectories. Drop us a message, and our
              team will reach out directly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => {
                  document
                    .getElementById("contact-form-section")
                    .scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative inline-flex items-center gap-2 bg-[#0066cc] hover:bg-[#004499] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Reach Out Below</span>
                <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </motion.div>
          </motion.div>

          {/* Right panel — image mosaic */}
          <div className="hidden lg:block absolute right-0 top-0 w-1/2 h-full overflow-hidden">
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="absolute inset-0 bg-slate-950/30 z-10" />

            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.2 }}
              className="absolute inset-0 p-4 pl-0 py-8"
            >
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
                  alt="Customer Support"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>
            </motion.div>
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
            Connect
          </motion.div>
        </section>

        {/* Dynamic Contact Form Section */}
        <section
          id="contact-form-section"
          className="relative py-28 px-8 sm:px-16 lg:px-24 bg-slate-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-70 pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

              {/* Column 1: Core Channels & Info Layout */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="lg:col-span-5 space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                    Get in touch with the <span className="bg-gradient-to-r from-[#004499] to-[#00a6ff] bg-clip-text text-transparent">right team.</span>
                  </h2>
                  <p className="text-slate-500 mt-3 text-base leading-relaxed">
                    Select a channel below to ensure your message routes directly to the correct administration office.
                  </p>
                </div>

                {/* School Division Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/50 flex gap-5 items-start relative overflow-hidden group transition-all"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#004499]" />
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004499] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FiBookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">For Schools </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">For enrollments, primary curriculam, student records, and formal campus relations.</p>
                    <a href="mailto:school@eddva.com" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#004499] pt-2 hover:underline">
                      <FiMail className="w-3.5 h-3.5" /> school@eddva.in
                    </a>
                  </div>
                </motion.div>

                {/* Coaching Academy Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/50 flex gap-5 items-start relative overflow-hidden group transition-all"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00a6ff]" />
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#00a6ff] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FiAward className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">For Coaching & Training Hub</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">For competitive exams, professional skilling courses, schedule mock trials, and custom bootcamps.</p>
                    <a href="mailto:coaching@eddva.com" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#004499] pt-2 hover:underline">
                      <FiMail className="w-3.5 h-3.5" /> coaching@eddva.in
                    </a>
                  </div>
                </motion.div>

                {/* General Support Information */}
                <div className="pt-4 border-t border-slate-200/60 space-y-4">
                  <div className="text-sm text-slate-500">
                    <p className="text-lg font-bold text-slate-800 mb-2">Call us</p>

                    <div className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-slate-400" />
                      <a
                        href="tel:+917894689818"
                        className="text-lg text-[#0066cc] hover:underline"
                      >
                        +91 7894689818
                      </a>
                    </div>
                  </div>
                  {/* <div className="flex gap-3 text-sm text-slate-500">
                    <FiMapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-800">Headquarters Campus</p>
                      <p>100 Innovation Way, Suite 400, New York, NY 10001</p>
                    </div>
                  </div> */}
                </div>
              </motion.div>

              {/* Column 2: Interactive Switcher & Form Wrapper */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease, delay: 0.2 }}
                className="lg:col-span-7"
              >
                <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40">
                  <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Visual Segmented Switcher */}
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-3">Which department are you contacting?</label>
                      <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200/40 relative">
                        <button
                          type="button"
                          onClick={() => handleDeptSelect("school")}
                          className={`relative z-10 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${formData.department === "school" ? "text-white bg-[#004499] shadow-md" : "text-slate-600 hover:text-slate-900"}`}
                        >
                          School Division
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeptSelect("coaching")}
                          className={`relative z-10 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${formData.department === "coaching" ? "text-white bg-[#00a6ff] shadow-md" : "text-slate-600 hover:text-slate-900"}`}
                        >
                          Coaching Academy
                        </button>
                      </div>
                    </div>

                    {/* Basic Context Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name..."
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066cc] transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter you mail..."
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066cc] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Inquiry regarding registrations..."
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066cc] transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Type your formal inquiry details here..."
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066cc] transition-all resize-none"
                      />
                    </div>

                    {/* Dispatch Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full relative overflow-hidden group rounded-xl bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.01] disabled:opacity-70"
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isSubmitting ? "Sending Message..." : "Submit Inquiry"}
                        {!isSubmitting && <FiSend className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                      </span>
                    </button>

                    <AnimatePresence>
                      {submitted && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium text-center"
                        >
                          Thank you! Your email routing directly to our {formData.department} staff has been initiated.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
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
                  Ready to take the
                  <br />
                  <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                    next step?
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
                  Join thousands of learners who chose to invest in themselves. Secure
                  your seat in our next cohort today.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">Enroll Now</span>
                    <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>

                  <Link
                    to="/courses"
                    className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:border-[#0066cc]/40 hover:text-slate-900 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-md"
                  >
                    View Courses
                  </Link>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                  Secure checkout. Cancel anytime.
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </LandingLayout>
  );
}