import React from "react";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { B, P } from "./DesignTokens";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] font-sans text-gray-900 antialiased">
      <LandingNavbar />
      <main>{children}</main>
      <LandingFooter />

      {/* ─── FLOATING AI BUTTON ─── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.12, boxShadow: `0 16px 48px ${B}55` }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
        title="Chat with AI">
        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
      </motion.button>
    </div>
  );
};
