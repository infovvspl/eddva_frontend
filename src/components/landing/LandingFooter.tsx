import { Link } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react";
import { EddvaLogo } from "@/components/branding/EddvaLogo";

const CONTACT_EMAIL = "hello@eddva.com";

const columns = [
  {
    title: "Platform",
    items: [
      { label: "AI Assessment", to: "/" },
      { label: "Doubt Solver", to: "/" },
      { label: "Live Classes", to: "/" },
      { label: "Mock Tests", to: "/" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", to: "/about-us" },
      { label: "Careers", to: "/career" },
      {
        label: "Contact Us",
        href: `mailto:${CONTACT_EMAIL}`,
      },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

function FooterLink({ item }: any) {
  const classes =
    "text-slate-300 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex";

  if (item.href)
    return (
      <a href={item.href} className={classes}>
        {item.label}
      </a>
    );

  return (
    <Link to={item.to} className={classes}>
      {item.label}
    </Link>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid gap-8 py-16 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/">
              <EddvaLogo className="h-20 w-auto bg-white px-2 rounded-xl" />
            </Link>

            {/* <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <Mail size={16} />
              {CONTACT_EMAIL}
            </a> */}

            {/* Socials */}
            {/* <div className="mt-8 flex gap-4">
              {[
                Linkedin,
                Instagram,
                Youtube,
                Twitter,
              ].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-xl border border-white/10 p-3 text-slate-400 transition hover:border-blue-500 hover:text-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div> */}
          </div>

          {/* Links */}
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col items-center lg:items-start">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
                {column.title}
              </h3>

              <ul className="space-y-4 text-center lg:text-left">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <FooterLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/30 py-6 text-sm text-slate-300 md:flex-row">
          <p className="text-center">
            © {new Date().getFullYear()} EDDVA — Education Plus Advancement. All
            rights reserved.
          </p>

          <p className="flex items-center gap-2">
            Made with ❤️ in India by <a href="https://vvspltech.com/">VVSPL</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
