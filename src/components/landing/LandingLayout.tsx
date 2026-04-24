import React from "react";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { B, P } from "./DesignTokens";
import { CookieConsentBar } from "./CookieConsentBar";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#F8FAFC] font-sans text-gray-900 antialiased">
      <LandingNavbar />
      <main className="pt-[56px]">{children}</main>
      <LandingFooter />

      <CookieConsentBar />

      {/* ─── FLOATING AI BUTTON (above cookie bar) ─── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.12, boxShadow: `0 16px 48px ${B}55` }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-[calc(8rem+env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl sm:bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:right-6 sm:h-14 sm:w-14"
        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
        title="Chat with AI"
      >
        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
      </motion.button>
    </div>
  );
};

export default LandingLayout;
