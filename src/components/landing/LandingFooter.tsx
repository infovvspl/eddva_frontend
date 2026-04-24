import { Link } from "react-router-dom";
import { EddvaLogo } from "@/components/branding/EddvaLogo";

const CONTACT_EMAIL = "hello@eddva.com";

type NavItem = { label: string; to?: string; href?: string };

const columns: { title: string; items: NavItem[] }[] = [
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
      { label: "About EDDVA", to: "/about-us" },
      { label: "Careers", to: "/career" },
      { label: "Contact", href: `mailto:${CONTACT_EMAIL}?subject=Contact%20EDDVA` },
    ],
  },
  {
    title: "Support",
    items: [

      { label: "Privacy Policy", to: "/privacy-policy" },
  
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
      <div className="grid gap-10 text-center md:grid-cols-2 md:text-left xl:grid-cols-4">
        <div className="flex flex-col items-center md:items-start">
          <Link to="/" className="inline-block">
            <EddvaLogo className="mb-5" />
          </Link>

        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col items-center md:items-start">
            <h5 className="mb-5 text-[16px] font-bold uppercase tracking-widest text-black-400">{col.title}</h5>
            <ul className="space-y-2.5 text-black-400">
              {col.items.map((item) => (
                <li key={item.label}>
                  <FooterLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-center sm:flex-row sm:text-left">
        <p className="text-[13px] text-gray-400">
          © {new Date().getFullYear()} EDDVA — Education Plus Advancement. All rights reserved.
        </p>
        <p className="text-[13px] text-gray-400">Made with ❤️ in India</p>
      </div>
    </div>
  </footer>
);
