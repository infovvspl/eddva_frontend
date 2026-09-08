// Footer.jsx — New Website Mockup
// Dark navy footer, matching the blue used on the contact card's aside panel
// (same gradient family) so the two blue surfaces on /contact read as one
// system. A tinted gradient hairline sits on the top border, the brand block
// runs beside four link columns, and a bottom bar carries the socials,
// copyright, legal links and a back-to-top control.
//
// Socials sit in the bottom bar, balancing the legal links rather than
// crowding the blurb; contact details keep their own column.
//
// No photograph behind it: the footer paints its own ground — a blue
// gradient with a radial bloom and a faint dot grid — and closes on a solid
// navy bar. assets/footer bg.jpg is no longer referenced here.
//
// Copy is unchanged throughout — the blurb, the column titles, every label and
// the bottom bar text are exactly as they were. Only the treatment moved.

import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowUp, Download } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";
import { socials } from "../data/socials";
import { emails, PHONE, ADDRESS } from "../data/contact";
import { products } from "../data/products";

// Every link here is a real route now, not a same-page anchor — the footer
// is mounted on every page (including all the dedicated sub-pages), so a
// bare "#nw-x" href only ever worked while already sitting on "/", and did
// nothing from anywhere else. Institutes and Stakeholders still point at
// anchors, but full ones ("/solution#id") that resolve on any page.
const columns = [
  {
    id: "nw-foot-quick",
    title: "Quick Links",
    links: [
      { id: "home",     label: "Home",     to: "/" },
      { id: "about",    label: "About Us", to: "/about" },
      { id: "products", label: "Products", to: "/products" },
      { id: "services", label: "Services", to: "/solution" },
    ],
  },
  {
    id: "nw-foot-products",
    title: "Products",
    // Each product now has its own page (see pages/ProductDetailPage) —
    // built straight from data/products.js so a new product never needs a
    // matching footer entry written by hand.
    links: products.map(({ id, slug, title }) => ({
      id, label: title, to: `/products/${slug}`,
    })),
  },
  {
    id: "nw-foot-services",
    title: "Services",
    links: [
      { id: "institutions", label: "For Institutions", to: "/solution/institutions" },
      { id: "stakeholders", label: "Stakeholders",     to: "/solution#nw-solution-roles" },
      { id: "demo",         label: "Book a Demo",    to: "/contact" },
      { id: "login",        label: "Login",          to: "/login" },
    ],
  },
];

// Both mailboxes are published — schools and coaching institutes are
// different inboxes, so a visitor should not have to guess.
/* ⚠ The brochure PDF is not in the repo yet. This points at a public/ path,
   so dropping the file in at public/eddva-brochure.pdf makes the link work
   with no code change — until then it 404s. Update the filename here if the
   team names it something else. */
const BROCHURE_URL = "/eddva-brochure.pdf";

const DEVELOPER = { label: "vvspltech.com", href: "https://vvspltech.com" };

const contacts = [
  { id: "phone", Icon: Phone, label: PHONE.display, href: PHONE.href },
  ...emails.map(({ id, address }) => ({
    id, Icon: Mail, label: address, href: `mailto:${address}`,
  })),
  { id: "place", Icon: MapPin, label: ADDRESS, href: null },
];

const Footer = () => {
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="nw-footer" id="nw-contact">
      <span className="nw-footer__rule" aria-hidden="true" />
      <span className="nw-footer__glow" aria-hidden="true" />
      <span className="nw-footer__grid" aria-hidden="true" />

      <div className="nw-footer__container">

        {/* Brand */}
        <div className="nw-footer__brand">
          <img src={LOGO} alt={LOGO_ALT} className="nw-footer__logo" id="nw-footer-logo" />
          <p className="nw-footer__blurb">
            Education Development &amp; Advancement<br />
            All-in-one AI-Powered Platform for Schools &amp; Institutes.
          </p>

          <a
            href={BROCHURE_URL}
            className="nw-footer__brochure"
            id="nw-foot-brochure"
            download
          >
            <Download size={16} strokeWidth={2.2} />
            Download Brochure
          </a>
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
          <span className="nw-footer__sep">|</span>
          Developed by{" "}
          <a
            href={DEVELOPER.href}
            className="nw-footer__dev"
            id="nw-foot-dev"
            target="_blank"
            rel="noreferrer"
          >
            {DEVELOPER.label}
          </a>
        </span>

        <div className="nw-footer__legal">
          <Link to="/privacy-policy" className="nw-footer__link" id="nw-foot-privacy">Privacy Policy</Link>
          <span className="nw-footer__sep">|</span>
          <Link to="/terms" className="nw-footer__link" id="nw-foot-terms">Terms &amp; Conditions</Link>
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
