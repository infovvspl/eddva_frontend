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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 antialiased">
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
        title="Chat with AI">
        <Bot className="h-6 w-6" />
      </motion.button>
    </div>
  );
};
