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
import { Phone, Mail, MapPin, Clock, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitLead } from "../../lib/api/leads";
import { socials } from "../data/socials";
import { emails, emailFor, PHONE, ADDRESS, HOURS } from "../data/contact";

// Schools and coaching institutes have separate mailboxes, so both are listed
// with the label that says which is which.
const details = [
  { id: "nw-contact-phone", Icon: Phone, label: "Call us", value: PHONE.display, href: PHONE.href },
  ...emails.map(({ id, address, label }) => ({
    id: `nw-contact-mail-${id}`,
    Icon: Mail,
    label,
    value: address,
    href: `mailto:${address}`,
  })),
  { id: "nw-contact-address", Icon: MapPin, label: "Visit us",     value: ADDRESS, href: null },
  { id: "nw-contact-hours",   Icon: Clock,  label: "Office hours", value: HOURS,   href: null },
];

// `vertical` maps onto the backend's LeadVertical enum where the choice implies
// one; the rest submit without a vertical.
const interests = [
  { label: "A demo for my school",    vertical: "SCHOOL" },
  { label: "A demo for my institute", vertical: "COACHING" },
  { label: "Pricing and plans",       vertical: null },
  { label: "Partnership",             vertical: null },
  { label: "Something else",          vertical: null },
];

const LIMITS = { name: 120, email: 200, phone: 40, institution: 160, message: 2000 };

const EMPTY = {
  name: "", institution: "", email: "", phone: "",
  interest: interests[0].label, message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

/** Returns a message for each invalid field; an empty object means valid. */
const validate = form => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Please tell us your name.";
  else if (form.name.length > LIMITS.name) errors.name = `Keep this under ${LIMITS.name} characters.`;

  if (!form.email.trim()) errors.email = "We need an email to reply to.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "That does not look like a valid email address.";

  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
    errors.phone = "Use digits, spaces and + only.";

  if (form.institution.length > LIMITS.institution)
    errors.institution = `Keep this under ${LIMITS.institution} characters.`;

  if (!form.message.trim()) errors.message = "Tell us a little about what you need.";
  else if (form.message.length > LIMITS.message)
    errors.message = `Keep this under ${LIMITS.message} characters.`;

  return errors;
};

const ContactSection = () => {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const errors = validate(form);
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

  const field = (name, label, input) => (
    <label className={`nw-contactp__field${showError(name) ? " nw-contactp__field--bad" : ""}`}>
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
        <div className="nw-contactp__card">

          {/* ── Reach us ── */}
          <aside className="nw-contactp__aside">
            <span className="nw-contactp__glow" aria-hidden="true" />
            <span className="nw-contactp__grid-bg" aria-hidden="true" />

            <div className="nw-contactp__aside-inner">
              <h2 className="nw-contactp__aside-title">Talk to the EDDVA Team</h2>
              <p className="nw-contactp__aside-lead">
                Tell us about your institution and we will show you exactly how
                EDDVA fits — academics, administration and analytics in one place.
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
            <h3 className="nw-contactp__form-title">Send us an enquiry</h3>

            <div className="nw-contactp__row">
              {field("name", "Your name",
                <input className="nw-contactp__input" id="nw-contact-name" type="text"
                  placeholder=" " maxLength={LIMITS.name} value={form.name}
                  onChange={update("name")} onBlur={blur("name")}
                  aria-invalid={Boolean(showError("name"))} />
              )}
              {field("institution", "Institution",
                <input className="nw-contactp__input" id="nw-contact-institution" type="text"
                  placeholder=" " maxLength={LIMITS.institution} value={form.institution}
                  onChange={update("institution")} onBlur={blur("institution")}
                  aria-invalid={Boolean(showError("institution"))} />
              )}
            </div>

            <div className="nw-contactp__row">
              {field("email", "Email",
                <input className="nw-contactp__input" id="nw-contact-email" type="email"
                  placeholder=" " maxLength={LIMITS.email} value={form.email}
                  onChange={update("email")} onBlur={blur("email")}
                  aria-invalid={Boolean(showError("email"))} />
              )}
              {field("phone", "Phone",
                <input className="nw-contactp__input" id="nw-contact-phone-field" type="tel"
                  placeholder=" " maxLength={LIMITS.phone} value={form.phone}
                  onChange={update("phone")} onBlur={blur("phone")}
                  aria-invalid={Boolean(showError("phone"))} />
              )}
            </div>

            {/* A select always has a value, so its label sits raised permanently */}
            <label className="nw-contactp__field nw-contactp__field--filled">
              <select className="nw-contactp__input nw-contactp__select" id="nw-contact-interest"
                value={form.interest} onChange={update("interest")}>
                {interests.map(({ label }) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
              <span className="nw-contactp__label">I am interested in</span>
            </label>

            {field("message", "Message",
              <textarea className="nw-contactp__input nw-contactp__textarea" id="nw-contact-message"
                rows={5} placeholder=" " maxLength={LIMITS.message} value={form.message}
                onChange={update("message")} onBlur={blur("message")}
                aria-invalid={Boolean(showError("message"))} />
            )}
            <span className="nw-contactp__counter">
              {form.message.length} / {LIMITS.message}
            </span>

            <div className="nw-contactp__actions">
              <button className="nw-contactp__submit" id="nw-contact-submit" type="submit"
                disabled={!isValid || status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.2} className="nw-contactp__spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} strokeWidth={2.2} />
                    Send enquiry
                  </>
                )}
              </button>
              {!isValid && Object.keys(touched).length > 0 && (
                <span className="nw-contactp__hint">Fill the highlighted fields to send.</span>
              )}
            </div>

            {status === "sent" && (
              <p className="nw-contactp__note nw-contactp__note--ok" role="status">
                <CheckCircle2 size={17} strokeWidth={2.2} />
                Thanks — your enquiry is with the team. We usually reply within
                one working day.
              </p>
            )}

            {status === "error" && (
              <p className="nw-contactp__note nw-contactp__note--bad" role="alert">
                <AlertCircle size={17} strokeWidth={2.2} />
                <span>
                  That did not go through. Please try again, or write to{" "}
                  <a href={`mailto:${fallbackEmail.address}`} className="nw-contactp__note-link">
                    {fallbackEmail.address}
                  </a>{" "}
                  directly.
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
