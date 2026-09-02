// Footer.jsx — New Website Mockup
// Light footer: an off-white ground that continues the page rather than
// capping it with a dark block. A tinted gradient hairline sits on the top
// border, the brand block runs beside four link columns, and a bottom bar
// carries the socials, copyright, legal links and a back-to-top control.
//
// Socials sit in the bottom bar, balancing the legal links rather than
// crowding the blurb; contact details keep their own column.
//
// Copy is unchanged throughout — the blurb, the column titles, every label and
// the bottom bar text are exactly as they were. Only the treatment moved.

import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowUp } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";
import { socials } from "../data/socials";

const columns = [
  {
    id: "nw-foot-quick",
    title: "Quick Links",
    links: [
      { id: "home",     label: "Home",     href: "#nw-home" },
      { id: "about",    label: "About Us", href: "#nw-about" },
      { id: "products", label: "Products", href: "#nw-product" },
      { id: "services", label: "Services", href: "#nw-solution" },
    ],
  },
  {
    id: "nw-foot-products",
    title: "Products",
    links: [
      { id: "lms",      label: "AI-LMS",                    href: "#nw-prod-lms" },
      { id: "erp",      label: "ERP",                       href: "#nw-prod-erp" },
      { id: "combo",    label: "Combo (ERP + AI-LMS)",      href: "#nw-prod-combo" },
      { id: "jeeai",    label: "JEE / NEET (AI Model)",     href: "#nw-prod-jee-ai" },
      { id: "jeenonai", label: "JEE / NEET (Non-AI Model)", href: "#nw-prod-jee-nonai" },
    ],
  },
  {
    id: "nw-foot-services",
    title: "Services",
    links: [
      { id: "schools",      label: "For Schools",    href: "#nw-svc-schools" },
      { id: "institutes",   label: "For Institutes", href: "#nw-svc-institutes" },
      { id: "stakeholders", label: "Stakeholders",   href: "#nw-solution" },
      { id: "demo",         label: "Book a Demo",    to: "/contact" },
      { id: "login",        label: "Login",          to: "/login" },
    ],
  },
];

const contacts = [
  { id: "phone", Icon: Phone,  label: "+91 79780 73201",            href: "tel:+917978073201" },
  { id: "mail",  Icon: Mail,   label: "info@eddva.com",             href: "mailto:info@eddva.com" },
  { id: "place", Icon: MapPin, label: "Bhubaneswar, Odisha, India", href: null },
];

const Footer = () => {
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="nw-footer" id="nw-contact">
      <span className="nw-footer__rule" aria-hidden="true" />
      <span className="nw-footer__glow" aria-hidden="true" />

      <div className="nw-footer__container">

        {/* Brand */}
        <div className="nw-footer__brand">
          <img src={LOGO} alt={LOGO_ALT} className="nw-footer__logo" id="nw-footer-logo" />
          <p className="nw-footer__blurb">
            Education Development &amp; Advancement<br />
            All-in-one AI-Powered Platform for Schools &amp; Institutes.
          </p>
        </div>

        {/* Link columns */}
        {columns.map(col => (
          <div className="nw-footer__col" key={col.id} id={col.id}>
            <h4 className="nw-footer__col-title">{col.title}</h4>
            <ul className="nw-footer__list">
              {col.links.map(link => (
                <li key={link.id}>
                  {link.to ? (
                    <Link to={link.to} className="nw-footer__link" id={`${col.id}-${link.id}`}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="nw-footer__link" id={`${col.id}-${link.id}`}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div className="nw-footer__col" id="nw-foot-contact">
          <h4 className="nw-footer__col-title">Contact Us</h4>
          <ul className="nw-footer__list">
            {contacts.map(({ id, Icon, label, href }) => (
              <li className="nw-footer__contact" key={id}>
                <Icon size={15} strokeWidth={1.8} />
                {href ? (
                  <a href={href} className="nw-footer__link">{label}</a>
                ) : (
                  <span className="nw-footer__link nw-footer__link--static">{label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="nw-footer__bottom">
        <div className="nw-footer__socials">
          {socials.map(({ id, label, brand, href, path }) => (
            <a
              key={id}
              id={id}
              href={href}
              className="nw-footer__social"
              style={{ "--nw-social-brand": brand }}
              aria-label={label}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d={path} />
              </svg>
            </a>
          ))}
        </div>

        <span className="nw-footer__copy">
          © {new Date().getFullYear()} EDDVA. All Rights Reserved.
        </span>

        <div className="nw-footer__legal">
          <a href="#nw-privacy" className="nw-footer__link" id="nw-foot-privacy">Privacy Policy</a>
          <span className="nw-footer__sep">|</span>
          <a href="#nw-terms" className="nw-footer__link" id="nw-foot-terms">Terms &amp; Conditions</a>
          <button
            type="button"
            className="nw-footer__top"
            id="nw-foot-top"
            aria-label="Back to top"
            onClick={toTop}
          >
            <ArrowUp size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
