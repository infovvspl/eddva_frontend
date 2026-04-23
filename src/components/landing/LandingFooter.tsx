import { Link } from "react-router-dom";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const CONTACT_EMAIL = "hello@eddva.com";

type NavItem = { label: string; to?: string; href?: string };

const columns: { title: string; items: NavItem[] }[] = [
  {
    title: "Platform",
    items: [
      { label: "AI Assessment", to: "/exams-registration" },
      { label: "Doubt Solver", to: "/about-us" },
      { label: "Live Classes", to: "/#videos" },
      { label: "Mock Tests", to: "/courses" },
      { label: "Analytics", to: "/career" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About EDDVA", to: "/about-us" },
      { label: "Careers", to: "/career" },
      { label: "Contact", href: `mailto:${CONTACT_EMAIL}?subject=Contact%20EDDVA` },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", to: "/study-material" },
      { label: "Book Demo", href: `mailto:${CONTACT_EMAIL}?subject=Book%20a%20demo` },
      { label: "Partner With Us", href: `mailto:${CONTACT_EMAIL}?subject=Partnership%20enquiry` },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Cookie Policy", to: "/cookie-policy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

function FooterLink({ item }: { item: NavItem }) {
  const className =
    "text-[14px] font-medium text-gray-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-sm";

  if (item.href) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }
  if (item.to?.startsWith("/#")) {
    return (
      <a href={item.to} className={className}>
        {item.label}
      </a>
    );
  }
  if (item.to) {
    return (
      <Link to={item.to} className={className}>
        {item.label}
      </Link>
    );
  }
  return <span className="text-[14px] text-gray-400">{item.label}</span>;
}

export const LandingFooter = () => (
  <footer className="border-t border-gray-100 bg-white py-14 sm:py-16">
    <div className="landing-shell">
      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Link to="/" className="inline-block">
            <img src={edvaLogo} alt="EDDVA" className="mb-5 h-19  object-contain" />
          </Link>
       
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="mb-5 text-[12px] font-bold uppercase tracking-widest text-gray-400">{col.title}</h5>
            <ul className="space-y-2.5">
              {col.items.map((item) => (
                <li key={item.label}>
                  <FooterLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
        <p className="text-[13px] text-gray-400">
          © {new Date().getFullYear()} EDDVA — Education Plus Advancement. All rights reserved.
        </p>
        <p className="text-[13px] text-gray-400">Made with ❤️ in India</p>
      </div>
    </div>
  </footer>
);
