import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Sparkles
} from "lucide-react";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { B, P } from "./DesignTokens";

export const LandingNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Courses", href: "/courses" },
    { name: "About Us", href: "/about-us" },
    { name: "Career", href: "/career" }
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/95 supports-[backdrop-filter]:md:bg-white/80 supports-[backdrop-filter]:md:backdrop-blur-lg">
      <div className="landing-shell flex items-center justify-between py-2">
        <Link to="/" className="flex max-w-[min(58vw,12rem)] shrink-0 items-center sm:max-w-[16rem]">
          <EddvaLogo className="h-20 w-auto sm:h-18" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex lg:gap-8">
          {navLinks.map(link => (
            <Link key={link.name} to={link.href}
              className="group relative text-[18px] font-black uppercase tracking-widest text-black transition-colors hover:text-blue-600">
              {link.name}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 origin-left scale-x-0 bg-blue-600 transition-all group-hover:w-full group-hover:scale-x-100" />
            </Link>
          ))}

        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/login"
            className="rounded-xl px-4 py-2.5 text-[18px] font-bold text-gray-600 transition-all hover:bg-blue-50/50 hover:text-blue-600">
            Login
          </Link>
          <motion.div whileHover={{ scale: 1.05, boxShadow: `0 12px 30px rgba(230, 0, 0, 0.2)` }} whileTap={{ scale: 0.95 }}>
            <Link to="/register"
              className="btn-register-glossy shadow-lg">
              REGISTER NOW
            </Link>
          </motion.div>
        </div>

        <button className="rounded-xl p-2 hover:bg-gray-100 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white px-4 pb-6 sm:px-5 lg:hidden">
            {navLinks.map(link => (
              <Link key={link.name} to={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-[14px] font-black uppercase tracking-widest text-gray-700 hover:text-blue-600 border-b border-gray-50">
                {link.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block rounded-2xl border-2 border-gray-100 py-3.5 text-center text-[15px] font-black text-gray-700 hover:bg-gray-50 transition-colors">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="btn-register-glossy block text-center shadow-lg">
                REGISTER NOW
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
