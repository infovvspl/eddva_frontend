import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

// Interface configuration for FAQ schema typing
interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What is EDDVA?",
    answer: "EDDVA is an innovative education platform dedicated to enhancing learning experiences through technology, providing students, educators, and institutions with tools and resources that support effective learning and growth.",
  },
  {
    id: 2,
    question: "Who can use EDDVA?",
    answer: "EDDVA is designed for students, teachers, educational institutions, and lifelong learners looking to improve their learning journey through modern and accessible educational solutions.",
  },
  {
    id: 3,
    question: "How does EDDVA help learners?",
    answer: "EDDVA offers engaging learning experiences, personalized resources, and technology-driven solutions that help learners develop skills, gain knowledge, and achieve their academic or professional goals.",
  },
  {
    id: 4,
    question: "Is EDDVA accessible online?",
    answer: "Yes, EDDVA is designed to be accessible online, allowing users to learn, collaborate, and access educational resources anytime and from anywhere with an internet connection.",
  },
  {
    id: 5,
    question: "How can I get support or contact EDDVA?",
    answer: "You can reach our support team through the Contact Us page on our website. We are committed to assisting users with their questions, feedback, and technical support needs.",
  },
];

export default function FAQSection() {
  // Explicit union state typing for an open index reference or closed state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Fixed curve transition configuration array converted to a read-only tuple
  const fluidEase = [0.16, 1, 0.3, 1] as const;

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: fluidEase },
    },
  };

  return (
    <section className="relative w-full bg-white text-slate-900 py-24 px-6 sm:px-12 overflow-hidden">
      {/* Background Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* SECTION HEADER */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mb-16"
        >
          {/* Title */}
          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4"
          >
            Have Questions?{" "}
            <span className="font-spicy block sm:inline bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
              We’ve Got Answers.
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto"
          >
            Everything you need to know about our premium platform, courses, and mentoring networks.
          </motion.p>
        </motion.div>

        {/* FAQ ACCORDION LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: fluidEase }}
          className="space-y-4"
        >
          {faqData.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div
                key={faq.id}
                className={`group border rounded-2xl transition-all duration-300 bg-white ${
                  isOpen
                    ? "border-[#0066cc]/30 shadow-lg shadow-blue-500/5 bg-slate-50/30"
                    : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer select-none"
                >
                  <span
                    className={`text-base sm:text-lg font-bold tracking-tight transition-colors duration-200 ${
                      isOpen ? "text-[#0066cc]" : "text-slate-800 group-hover:text-slate-900"
                    }`}
                  >
                    {faq.question}
                  </span>
                  
                  {/* Icon Container */}
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 border flex items-center justify-center flex-shrink-0 ml-4 ${
                      isOpen
                        ? "bg-gradient-to-tr from-[#004499] to-[#0066cc] border-transparent text-white rotate-180 shadow-md shadow-blue-500/25"
                        : "bg-slate-50 border-slate-200 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100"
                    }`}
                  >
                    <FiChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* Animated Collapsible Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: { duration: 0.4, ease: fluidEase },
                          opacity: { duration: 0.25, delay: 0.05 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.3, ease: fluidEase },
                          opacity: { duration: 0.15 },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm sm:text-base text-slate-500 font-medium leading-relaxed border-t border-slate-100/80 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}