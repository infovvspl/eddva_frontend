// Footer.jsx — New Website Mockup
// Light footer panel inset into a blue frame, closing on a campus skyline.
//
// Structure follows the supplied reference — coloured frame, inset rounded
// card, brand + newsletter across the top, link columns beneath, centred
// copyright, illustrated strip along the bottom. The reference's terracotta
// palette is NOT adopted: EDDVA stays blue, only the shape language is taken.
//
// Every label, column title and line of copy is the same as before; what
// changed is the arrangement. The socials moved out of the brand block and
// into the Contact Us column, where the reference groups them.
//
// Links are SiteLinks so the in-page anchors still resolve from the sub-pages.

import { useState } from "react";
import { Phone, Mail, MapPin, ArrowRight, Check, Loader2 } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";
import SiteLink, { HOME_PATH } from "./SiteLink";
import FooterSkyline from "./FooterSkyline";
import { submitLead } from "../../lib/api/leads";

const columns = [
  {
    id: "nw-foot-quick",
    title: "Quick Links",
    links: [
      { id: "home",     label: "Home",     to: HOME_PATH },
      { id: "about",    label: "About Us", to: `${HOME_PATH}/about` },
      { id: "products", label: "Products", to: `${HOME_PATH}/products` },
      { id: "services", label: "Services", to: `${HOME_PATH}/solution` },
      { id: "pricing",  label: "Pricing",  to: `${HOME_PATH}/pricing` },
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
      { id: "demo",         label: "Book a Demo",    to: `${HOME_PATH}/contact` },
      { id: "login",        label: "Login",          href: "#nw-login" },
    ],
  },
];

const socials = [
  { id: "nw-foot-wa", label: "WhatsApp",  brand: "#25d366", href: "https://wa.me/917978073201",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.416-8.4" },
  { id: "nw-foot-ig", label: "Instagram", brand: "#dc2743", href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  { id: "nw-foot-li", label: "LinkedIn",  brand: "#0a66c2", href: "#",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { id: "nw-foot-x", label: "X (Twitter)", brand: "#1d9bf0", href: "#",
    path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" },
];

/* ⚠ NEW COPY + BORROWED ENDPOINT.
   The reference footer carries a newsletter block, so one is built here — but
   this backend has no newsletter/subscribe route. Rather than ship a form that
   silently does nothing, the address is filed through the public leads
   endpoint, tagged so it can be told apart from a sales enquiry. Point
   `subscribe` at a real mailing-list endpoint when one exists, or drop the
   block if the team would rather not have these in the leads table. */
const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const subscribe = async event => {
    event.preventDefault();
    if (!valid || state === "sending") return;
    setState("sending");
    try {
      const address = email.trim();
      await submitLead({
        name: address.split("@")[0].slice(0, 120),
        email: address,
        interestedFeature: "Newsletter",
        source: "new-website/footer-newsletter",
      });
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  return (
    <form className="nw-footer__news-form" id="nw-footer-newsletter" onSubmit={subscribe} noValidate>
      <div className="nw-footer__news-field">
        <input
          type="email"
          className="nw-footer__news-input"
          id="nw-footer-news-email"
          placeholder="Enter email address"
          aria-label="Email address"
          value={email}
          onChange={e => { setEmail(e.target.value); setState("idle"); }}
        />
        <button
          type="submit"
          className="nw-footer__news-btn"
          id="nw-footer-news-submit"
          disabled={!valid || state === "sending"}
        >
          {state === "sending" && <Loader2 size={14} strokeWidth={2.4} className="nw-footer__spin" />}
          {state === "done"    && <Check size={14} strokeWidth={2.8} />}
          {state !== "sending" && state !== "done" && <ArrowRight size={14} strokeWidth={2.6} />}
          Submit
        </button>
      </div>
      {state === "done" && (
        <span className="nw-footer__news-msg nw-footer__news-msg--ok" role="status">
          You are on the list — thank you.
        </span>
      )}
      {state === "error" && (
        <span className="nw-footer__news-msg nw-footer__news-msg--bad" role="alert">
          That did not go through. Please try again.
        </span>
      )}
    </form>
  );
};

const Footer = () => {
  return (
    <footer className="nw-footer" id="nw-contact">
      <div className="nw-footer__panel">

        {/* ── Top: brand + newsletter ── */}
        <div className="nw-footer__top">
          <div className="nw-footer__brand">
            <img src={LOGO} alt={LOGO_ALT} className="nw-footer__logo" id="nw-footer-logo" />
            <p className="nw-footer__blurb">
              Education Development &amp; Advancement<br />
              All-in-one AI-Powered Platform for Schools &amp; Institutes.
            </p>
          </div>

          <div className="nw-footer__news">
            <h4 className="nw-footer__col-title">Newsletter</h4>
            <NewsletterForm />
            <p className="nw-footer__news-note">
              Product updates, new features and what we are learning from
              schools — occasionally, never spam.
            </p>
          </div>
        </div>

        {/* ── Columns ── */}
        <div className="nw-footer__cols">
          {columns.map(col => (
            <div className="nw-footer__col" key={col.id} id={col.id}>
              <h4 className="nw-footer__col-title">{col.title}</h4>
              <ul className="nw-footer__list">
                {col.links.map(link => (
                  <li key={link.id}>
                    <SiteLink
                      to={link.to}
                      href={link.href}
                      className="nw-footer__link"
                      id={`${col.id}-${link.id}`}
                    >
                      {link.label}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact — the reference groups the socials here */}
          <div className="nw-footer__col" id="nw-foot-contact">
            <h4 className="nw-footer__col-title">Contact Us</h4>
            <ul className="nw-footer__list">
              <li className="nw-footer__contact">
                <Mail size={15} strokeWidth={1.8} />
                <a href="mailto:info@eddva.com" className="nw-footer__link">info@eddva.com</a>
              </li>
              <li className="nw-footer__contact">
                <Phone size={15} strokeWidth={1.8} />
                <a href="tel:+917978073201" className="nw-footer__link">+91 79780 73201</a>
              </li>
              <li className="nw-footer__contact">
                <MapPin size={15} strokeWidth={1.8} />
                <span className="nw-footer__link nw-footer__link--static">
                  Bhubaneswar, Odisha, India
                </span>
              </li>
            </ul>

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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="nw-footer__bottom">
          <span>© {new Date().getFullYear()} EDDVA. All Rights Reserved.</span>
          <div className="nw-footer__legal">
            <a href="#nw-privacy" className="nw-footer__link" id="nw-foot-privacy">Privacy Policy</a>
            <span className="nw-footer__sep">|</span>
            <a href="#nw-terms" className="nw-footer__link" id="nw-foot-terms">Terms &amp; Conditions</a>
          </div>
        </div>

      </div>

      <FooterSkyline />
    </footer>
  );
};

export default Footer;
