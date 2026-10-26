// ContactSection.jsx — /contact
//
// One elevated card split in two: a deep blue panel carrying the ways to reach
// us, against the enquiry form on white. Replaces the four loose detail cards
// beside a separate form — this reads as a single object and keeps the form,
// which is the point of the page, at full width.
//
// The form posts to the platform's real lead endpoint: POST
// /tenants/public/leads (LeadsController, unauthenticated and rate-limited,
// written for exactly this — "public Request a Demo capture"). It goes through
// the existing src/lib/api/leads.ts helper, so submissions land in the
// super-admin Leads screen at /super-admin/leads.
//
// Field names and limits mirror CreateLeadDto: name 120, email 200, phone 40,
// organization 160, interestedFeature 120, message 2000. `vertical` is the
// backend's SCHOOL | COACHING enum, inferred from the interest picker.
//
// If the request fails the form says so and offers the mailto: fallback rather
// than pretending the message went through.
//
// Phone, addresses and both mailboxes come from data/contact.js, so the
// footer and this page publish exactly the same details.

import { useState } from "react";
import {
  Phone, Mail, MapPin, Clock, Send, Loader2, CheckCircle2, AlertCircle,
  User, Building2, FileText, SlidersHorizontal, ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { submitLead } from "../../lib/api/leads";
import { socials } from "../data/socials";
import { emails, emailFor, PHONE } from "../data/contact";
import { localizeDigits } from "@/i18n/digits";
import useInView from "../hooks/useInView";

// Schools and coaching institutes have separate mailboxes, so both are listed
// with the label that says which is which.
const buildDetails = t => [
  { id: "nw-contact-phone", Icon: Phone, label: t("details.call"), value: localizeDigits(PHONE.display), href: PHONE.href },
  ...emails.map(({ id, address }) => ({
    id: `nw-contact-mail-${id}`,
    Icon: Mail,
    label: t(`details.mail.${id}`),
    value: address,
    href: `mailto:${address}`,
  })),
  { id: "nw-contact-address", Icon: MapPin, label: t("details.visit"), value: t("details.address"), href: null },
  { id: "nw-contact-hours",   Icon: Clock,  label: t("details.hours"), value: t("details.hoursValue"), href: null },
];

// `vertical` maps onto the backend's LeadVertical enum where the choice implies
// one; the rest submit without a vertical.
const interests = [
  { label: "A demo for my school",    vertical: "SCHOOL" },
  { label: "A demo for my institute", vertical: "COACHING" },
  { label: "Partnership",             vertical: null },
  { label: "Something else",          vertical: null },
];

const LIMITS = { name: 120, email: 200, phone: 40, institution: 160, message: 2000 };

const EMPTY = {
  name: "", institution: "", email: "", phone: "",
  interest: "", message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

/** Returns a message for each invalid field; an empty object means valid. */
const validate = (form, t) => {
  const errors = {};
  if (!form.name.trim()) errors.name = t("form.errors.name");
  else if (form.name.length > LIMITS.name) errors.name = t("form.errors.maxLen", { max: LIMITS.name });

  if (!form.email.trim()) errors.email = t("form.errors.email");
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = t("form.errors.emailInvalid");

  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
    errors.phone = t("form.errors.phone");

  if (form.institution.length > LIMITS.institution)
    errors.institution = t("form.errors.maxLen", { max: LIMITS.institution });

  if (!form.interest) errors.interest = t("form.errors.interest");

  if (!form.message.trim()) errors.message = t("form.errors.message");
  else if (form.message.length > LIMITS.message)
    errors.message = t("form.errors.maxLen", { max: LIMITS.message });

  return errors;
};

const ContactSection = () => {
  const { t } = useTranslation("contact");
  const details = buildDetails(t);
  const [cardRef, cardInView] = useInView({ threshold: 0.15 });
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const errors = validate(form, t);
  const isValid = Object.keys(errors).length === 0;
  // If the send fails, point them at the mailbox matching their enquiry
  const fallbackEmail = emailFor(
    interests.find(i => i.label === form.interest)?.vertical,
  );
  // An error only shows once the field has been left, or after a failed submit
  const showError = field => (touched[field] || status === "error") && errors[field];

  const update = field => event =>
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  const blur = field => () =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async event => {
    event.preventDefault();
    if (!isValid) {
      setTouched(Object.fromEntries(Object.keys(EMPTY).map(k => [k, true])));
      return;
    }
    setStatus("sending");
    try {
      await submitLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        organization: form.institution.trim() || undefined,
        vertical: interests.find(i => i.label === form.interest)?.vertical || undefined,
        interestedFeature: form.interest,
        message: form.message.trim(),
        source: "new-website/contact",
      });
      setStatus("sent");
      setForm(EMPTY);
      setTouched({});
    } catch {
      setStatus("error");
    }
  };

  const field = (name, label, input, Icon) => (
    <label
      className={`nw-contactp__field${Icon ? " nw-contactp__field--icon" : ""}${showError(name) ? " nw-contactp__field--bad" : ""}`}
    >
      {Icon && (
        <span className="nw-contactp__field-icon" aria-hidden="true">
          <Icon size={16} strokeWidth={1.9} />
        </span>
      )}
      {input}
      <span className="nw-contactp__label">{label}</span>
      {showError(name) && (
        <span className="nw-contactp__error" role="alert">
          <AlertCircle size={13} strokeWidth={2.2} />
          {errors[name]}
        </span>
      )}
    </label>
  );

  return (
    <section className="nw-contactp" id="nw-contact-page">
      <div className="nw-contactp__container">
        <div className={`nw-contactp__card${cardInView ? " nw-in" : ""}`} ref={cardRef}>

          {/* ── Reach us ── */}
          <aside className="nw-contactp__aside">
            <span className="nw-contactp__glow" aria-hidden="true" />
            <span className="nw-contactp__grid-bg" aria-hidden="true" />

            <div className="nw-contactp__aside-inner">
              <h2 className="nw-contactp__aside-title">{t("form.asideTitle")}</h2>
              <span className="nw-contactp__aside-rule" aria-hidden="true" />
              <p className="nw-contactp__aside-lead">
                {t("form.asideLead")}
              </p>

              <ul className="nw-contactp__details">
                {details.map(({ id, Icon, label, value, href }) => (
                  <li className="nw-contactp__detail" key={id} id={id}>
                    <span className="nw-contactp__detail-icon" aria-hidden="true">
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <span className="nw-contactp__detail-copy">
                      <span className="nw-contactp__detail-label">{label}</span>
                      {href ? (
                        <a href={href} className="nw-contactp__detail-value">{value}</a>
                      ) : (
                        <span className="nw-contactp__detail-value">{value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="nw-contactp__socials">
                {socials.map(({ id, label, href, path }) => (
                  <a
                    key={id}
                    id={`${id}-contact`}
                    href={href}
                    className="nw-contactp__social"
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
          </aside>

          {/* ── Enquiry form ── */}
          <form className="nw-contactp__form" id="nw-contact-form" onSubmit={handleSubmit} noValidate>
            <h3 className="nw-contactp__form-title">{t("form.title")}</h3>
            <p className="nw-contactp__form-lead">
              {t("form.lead")}
            </p>

            <div className="nw-contactp__row">
              {field("name", t("form.name"),
                <input className="nw-contactp__input" id="nw-contact-name" type="text"
                  placeholder=" " maxLength={LIMITS.name} value={form.name}
                  onChange={update("name")} onBlur={blur("name")}
                  aria-invalid={Boolean(showError("name"))} />,
                User
              )}
              {field("institution", t("form.institution"),
                <input className="nw-contactp__input" id="nw-contact-institution" type="text"
                  placeholder=" " maxLength={LIMITS.institution} value={form.institution}
                  onChange={update("institution")} onBlur={blur("institution")}
                  aria-invalid={Boolean(showError("institution"))} />,
                Building2
              )}
            </div>

            <div className="nw-contactp__row">
              {field("email", t("form.email"),
                <input className="nw-contactp__input" id="nw-contact-email" type="email"
                  placeholder=" " maxLength={LIMITS.email} value={form.email}
                  onChange={update("email")} onBlur={blur("email")}
                  aria-invalid={Boolean(showError("email"))} />,
                Mail
              )}
              {field("phone", t("form.phone"),
                <input className="nw-contactp__input" id="nw-contact-phone-field" type="tel"
                  placeholder=" " maxLength={LIMITS.phone} value={form.phone}
                  onChange={update("phone")} onBlur={blur("phone")}
                  aria-invalid={Boolean(showError("phone"))} />,
                Phone
              )}
            </div>

            {/* Label sits raised permanently — the box shows "Select an option"
               until a real choice is made, so it never overlaps a floating label. */}
            <label
              className={`nw-contactp__field nw-contactp__field--filled nw-contactp__field--icon${showError("interest") ? " nw-contactp__field--bad" : ""}`}
            >
              <span className="nw-contactp__field-icon" aria-hidden="true">
                <SlidersHorizontal size={16} strokeWidth={1.9} />
              </span>
              <select className="nw-contactp__input nw-contactp__select" id="nw-contact-interest"
                value={form.interest} onChange={update("interest")} onBlur={blur("interest")}
                aria-invalid={Boolean(showError("interest"))}>
                <option value="" disabled>{t("form.select")}</option>
                {interests.map(({ label }) => (
                  <option key={label} value={label}>{t(`interests.${label}`)}</option>
                ))}
              </select>
              <span className="nw-contactp__label">{t("form.interest")}</span>
              {showError("interest") && (
                <span className="nw-contactp__error" role="alert">
                  <AlertCircle size={13} strokeWidth={2.2} />
                  {errors.interest}
                </span>
              )}
            </label>

            {field("message", t("form.message"),
              <textarea className="nw-contactp__input nw-contactp__textarea" id="nw-contact-message"
                rows={5} placeholder=" " maxLength={LIMITS.message} value={form.message}
                onChange={update("message")} onBlur={blur("message")}
                aria-invalid={Boolean(showError("message"))} />,
              FileText
            )}
            <span className="nw-contactp__counter">
              {localizeDigits(`${form.message.length} / ${LIMITS.message}`)}
            </span>

            <div className="nw-contactp__actions">
              <button className="nw-contactp__submit" id="nw-contact-submit" type="submit"
                disabled={!isValid || status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.2} className="nw-contactp__spin" />
                    {t("form.sending")}
                  </>
                ) : (
                  <>
                    <Send size={16} strokeWidth={2.2} />
                    {t("form.send")}
                  </>
                )}
              </button>
              {!isValid && Object.keys(touched).length > 0 && (
                <span className="nw-contactp__hint">{t("form.hint")}</span>
              )}
              <span className="nw-contactp__trust">
                <ShieldCheck size={15} strokeWidth={2} />
                {t("form.trust")}
              </span>
            </div>

            {status === "sent" && (
              <p className="nw-contactp__note nw-contactp__note--ok" role="status">
                <CheckCircle2 size={17} strokeWidth={2.2} />
                {t("form.sent")}
              </p>
            )}

            {status === "error" && (
              <p className="nw-contactp__note nw-contactp__note--bad" role="alert">
                <AlertCircle size={17} strokeWidth={2.2} />
                <span>
                  {t("form.errorPre")}
                  <a href={`mailto:${fallbackEmail.address}`} className="nw-contactp__note-link">
                    {fallbackEmail.address}
                  </a>
                  {t("form.errorPost")}
                </span>
              </p>
            )}
          </form>

        </div>
      </div>
    </section>
  );
};

export default ContactSection;
