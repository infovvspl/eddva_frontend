import React from "react";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

export const LandingFooter = () => (
  <footer className="border-t border-gray-100 bg-white py-16">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid gap-12 md:grid-cols-4">
        <div>
          <img src={edvaLogo} alt="EDDVA" className="mb-5 h-10 w-auto object-contain" />
          <p className="max-w-xs text-[14px] leading-relaxed text-gray-500">
            India's AI-powered EdTech platform for JEE, NEET & beyond. Smarter learning, brighter futures.
          </p>
          <p className="mt-5 text-[13px] font-medium text-gray-400">🇮🇳 Available in Hindi & English</p>
        </div>
        {[
          { title: "Platform", links: ["AI Assessment", "Doubt Solver", "Live Classes", "Mock Tests", "Analytics"] },
          { title: "Company",  links: ["About EDDVA", "Careers", "Blog", "Press", "Contact"] },
          { title: "Support",  links: ["Help Center", "Book Demo", "Partner With Us", "Privacy Policy", "Terms"] },
        ].map(col => (
          <div key={col.title}>
            <h5 className="mb-5 text-[12px] font-bold uppercase tracking-widest text-gray-400">{col.title}</h5>
            <ul className="space-y-2.5">
              {col.links.map(link => (
                <li key={link}>
                  <a href="#" className="text-[14px] font-medium text-gray-500 transition-colors hover:text-blue-600">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
        <p className="text-[13px] text-gray-400">© 2025 EDDVA — Education Plus Advancement. All rights reserved.</p>
        <p className="text-[13px] text-gray-400">Made with ❤️ in India</p>
      </div>
    </div>
  </footer>
);
