import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, ChevronDown, Sparkles, BookOpen, Library, 
  GraduationCap, Play 
} from "lucide-react";
import edvaLogo from "@/assets/eddva web logo.png";
import { B, P } from "./DesignTokens";

export const LandingNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Courses", href: "/courses" },
    { name: "About Us", href: "/about-us" },
    { name: "Career", href: "/career" }
  ];

  const studyMaterialLinks = [
    { name: "PYQs",        href: "/study-material/pyqs",   icon: <BookOpen className="h-4 w-4" /> },
    { name: "Books",       href: "/study-material/books",  icon: <Library className="h-4 w-4" /> },
    { name: "Quiz",        href: "/study-material/quiz",   icon: <GraduationCap className="h-4 w-4" /> },
    { name: "Free Videos", href: "/study-material/videos", icon: <Play className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
      <div className="landing-shell flex items-center justify-between py-3.5">
        <Link to="/" className="flex items-center">
          <img src={edvaLogo} alt="EDDVA" className=" object-contain" />
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map(link => (
            <Link key={link.name} to={link.href}
              className="group relative text-[14px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-blue-600">
              {link.name}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 origin-left scale-x-0 bg-blue-600 transition-all group-hover:w-full group-hover:scale-x-100" />
            </Link>
          ))}

          {/* Study Material Dropdown */}
          <div className="relative" onMouseEnter={() => setStudyMenuOpen(true)} onMouseLeave={() => setStudyMenuOpen(false)}>
            <button className="flex items-center gap-1.5 text-[14px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-blue-600">
              Study Material
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${studyMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {studyMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-[24px] border border-white bg-white/80 p-2 shadow-2xl backdrop-blur-xl"
                >
                  {studyMaterialLinks.map(link => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                        {link.icon}
                      </div>
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link to="/login"
            className="rounded-xl px-4 py-2.5 text-[14px] font-bold text-gray-600 transition-all hover:bg-blue-50/50 hover:text-blue-600">
            Login
          </Link>
          <motion.div whileHover={{ scale: 1.05, boxShadow: `0 12px 30px ${B}33` }} whileTap={{ scale: 0.95 }}>
            <Link to="/register"
              className="landing-button relative flex items-center gap-2 overflow-hidden text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
              Register Free <Sparkles className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        <button className="rounded-xl p-2 hover:bg-gray-100 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white px-4 pb-6 sm:px-5 md:hidden">
            {navLinks.map(link => (
              <Link key={link.name} to={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-[14px] font-black uppercase tracking-widest text-gray-700 hover:text-blue-600 border-b border-gray-50">
                {link.name}
              </Link>
            ))}
            
            <div className="py-4">
              <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-gray-400">Study Material</p>
              <div className="grid grid-cols-2 gap-2">
                {studyMaterialLinks.map(link => (
                  <Link key={link.name} to={link.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-[13px] font-bold text-gray-600">
                    {link.icon} {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block rounded-2xl border-2 border-gray-100 py-3.5 text-center text-[15px] font-black text-gray-700 hover:bg-gray-50 transition-colors">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="landing-button block text-center text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                Register Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
