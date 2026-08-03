import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import logo from "../../assets/logo.svg";

// Type definitions for standard navigation structures
interface NavLink {
  label: string;
  to: string;
}

const navLinks: NavLink[] = [
  { label: "Home", to: "/" },
  { label: "About us", to: "/about" },
  { label: "Courses", to: "/courses" },
  { label: "Career", to: "/career" },
  { label: "Contact Us", to: "/contact" },
  { label: "Login", to: "/login" },
];

export default function Navbar() {
  // Explicitly typing state as a boolean
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full z-50 bg-white border-b border-blue-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* 1. Brand Logo (Aligned Left) */}
            <Link to="/" className="flex items-center gap-3 p-1 shrink-0">
              <div className="w-44 h-16">
                <img
                  src={logo}
                  alt="Eddva Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            {/* 2. Navigation Menu & CTA (Aligned Right - Desktop) */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Nav Links */}
              <div className="flex items-center gap-8">
                {navLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="relative text-[15px] font-bold text-black transition-all duration-300 group"
                  >
                    {item.label}
                    {/* Elegant underline */}
                    <span className="absolute left-0 -bottom-1 h-[2px] w-0 rounded-full bg-gradient-to-r from-[#004499] to-[#00a6ff] transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </div>

              {/* CTA BUTTON */}
              <Link
                to="/register"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Hover Shine */}
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className="relative z-10 flex items-center gap-2">
                  Register
                  <FiArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </div>

            {/* Mobile Toggler Action Button (Visible on Mobile/Tablet) */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200"
              >
                {mobileOpen ? (
                  <FiX className="w-5 h-5 text-slate-700" />
                ) : (
                  <FiMenu className="w-5 h-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Animated Dropdown Menu for Mobile Drawer Viewports */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 w-full bg-white border-b border-slate-200 z-40 lg:hidden"
          >
            <div className="px-4 py-5 flex flex-col gap-2">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Get Started
                <FiArrowUpRight />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}