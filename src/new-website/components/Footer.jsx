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
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, ArrowUp, Download } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";
import { socials } from "../data/socials";
import { emails, PHONE } from "../data/contact";
import { localizeDigits } from "@/i18n/digits";
import { products } from "../data/products";

// Every link here is a real route now, not a same-page anchor — the footer
// is mounted on every page (including all the dedicated sub-pages), so a
// bare "#nw-x" href only ever worked while already sitting on "/", and did
// nothing from anywhere else. Institutes and Stakeholders still point at
// anchors, but full ones ("/solution#id") that resolve on any page.
const columns = [
  {
    id: "nw-foot-quick",
    title: "footer.quickLinks",
    links: [
      { id: "home",     label: "nav.home",     to: "/" },
      { id: "about",    label: "footer.aboutUs", to: "/about" },
      { id: "products", label: "footer.products", to: "/products" },
      { id: "services", label: "footer.services", to: "/solution" },
      { id: "blog",     label: "nav.blog",     to: "/blog" },
    ],
  },
  {
    id: "nw-foot-products",
    title: "footer.products",
    // Each product now has its own page (see pages/ProductDetailPage) —
    // built straight from data/products.js so a new product never needs a
    // matching footer entry written by hand.
    links: products.map(({ id, slug, title }) => ({
      id, label: title, raw: true, to: `/products/${slug}`,
    })),
  },
  {
    id: "nw-foot-services",
    title: "footer.services",
    links: [
      { id: "institutions", label: "nav.forInstitutions", to: "/solution/institutions" },
      { id: "stakeholders", label: "footer.stakeholders", to: "/solution#nw-solution-roles" },
      { id: "demo",         label: "footer.bookDemo",    to: "/contact" },
      { id: "login",        label: "nav.login",          to: "/login" },
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

const DEVELOPER = { label: "VVSPL", href: "https://vvspltech.com" };

const buildContacts = t => [
  { id: "phone", Icon: Phone, label: localizeDigits(PHONE.display), href: PHONE.href },
  ...emails.map(({ id, address }) => ({
    id, Icon: Mail, label: address, href: `mailto:${address}`,
  })),
  { id: "place", Icon: MapPin, label: t("contact:details.address"), href: null },
];

const Footer = () => {
  const { t } = useTranslation(["common", "contact"]);
  const contacts = buildContacts(t);
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
            {t("footer.blurbLine1")}<br />
            {t("footer.blurbLine2")}
          </p>

          <a
            href={BROCHURE_URL}
            className="nw-footer__brochure"
            id="nw-foot-brochure"
            download
          >
            <Download size={16} strokeWidth={2.2} />
            {t("footer.downloadBrochure")}
          </a>
        </div>

        {/* Link columns */}
        {columns.map(col => (
          <div className="nw-footer__col" key={col.id} id={col.id}>
            <h4 className="nw-footer__col-title">{t(col.title)}</h4>
            <ul className="nw-footer__list">
              {col.links.map(link => (
                <li key={link.id}>
                  {link.to ? (
                    <Link to={link.to} className="nw-footer__link" id={`${col.id}-${link.id}`}>
                      {link.raw ? link.label : t(link.label)}
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
          <h4 className="nw-footer__col-title">{t("footer.contactUs")}</h4>
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
          © {new Date().getFullYear()} EDDVA. {t("footer.rights")}
          <span className="nw-footer__sep">|</span>
          {t("footer.developedBy")}{" "}
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
          <Link to="/privacy-policy" className="nw-footer__link" id="nw-foot-privacy">{t("footer.privacy")}</Link>
          <span className="nw-footer__sep">|</span>
          <Link to="/terms" className="nw-footer__link" id="nw-foot-terms">{t("footer.terms")}</Link>
          <button
            type="button"
            className="nw-footer__top"
            id="nw-foot-top"
            aria-label={t("footer.backToTop")}
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
