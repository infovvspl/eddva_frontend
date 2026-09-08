// FaqSection.jsx — /contact
// Split layout: the supplied illustration (assets/contactpageasset.png) and
// a prompt pointing at the full FAQ set on the left, single-column accordion
// (only one answer open at a time) on the right. Only mounted on /contact —
// the full set at /faq (FaqPage/FaqBrowser) is a separate component untouched
// by this.

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown, ArrowRight, HelpCircle, ShieldCheck,
  Building2, SlidersHorizontal, GraduationCap, Rocket,
} from "lucide-react";
import useInView from "../hooks/useInView";
import faqPromoImg from "../assets/contactpageasset.png";

const faqs = [
  {
    id: "nw-faq-what",
    Icon: HelpCircle,
    q: "What is EDDVA?",
    a: "EDDVA is an all-in-one AI-powered platform for schools and institutes. It brings together a learning management system, a full ERP and analytics so academics, administration and communication live in one place.",
  },
  {
    id: "nw-faq-secure",
    Icon: ShieldCheck,
    q: "Is my data secure?",
    a: "Yes. EDDVA is ISO 27001:2022 certified and uses encryption in transit and at rest, role-based access control and regular backups. Your institution's data is never shared with third parties.",
  },
  {
    id: "nw-faq-who",
    Icon: Building2,
    q: "Which institutions can use EDDVA?",
    a: "Schools, colleges, universities (nursing, PG, management and graduation programs), coaching centres and competitive-exam institutes. Modules can be switched on or off so a 200-student school and a 20,000-student group both get a setup that fits.",
  },
  {
    id: "nw-faq-custom",
    Icon: SlidersHorizontal,
    q: "Can EDDVA be customized?",
    a: "Absolutely. Branding, report formats, fee structures, grading schemes and workflows are all configurable, and our team can build institution-specific modules on request.",
  },
  {
    id: "nw-faq-training",
    Icon: GraduationCap,
    q: "Is training provided?",
    a: "Every rollout includes onboarding sessions for administrators, teachers and parents, plus recorded walkthroughs, documentation and 24/7 support after go-live.",
  },
  {
    id: "nw-faq-start",
    Icon: Rocket,
    q: "How can I get started?",
    a: "Book a free demo. We'll walk through your requirements, show the modules that matter to you and set up a pilot environment for your institution — usually within a week.",
  },
];

const FaqSection = () => {
  const [openId, setOpenId] = useState(null);
  const [ref, inView] = useInView({ threshold: 0.1 });

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id));

  return (
    <section className="nw-faq" id="nw-faq">
      <div className="nw-faq__container">

        <div className="nw-faq__header">
          <span className="nw-faq__label">FAQS</span>
          <h2 className="nw-faq__heading">Frequently Asked Questions</h2>
          <p className="nw-faq__sub">
            Find quick answers to common questions about EDDVA, our features,
            pricing and more.
          </p>
        </div>

        <div className="nw-faq__layout">
          <div className="nw-faq__promo">
            <img src={faqPromoImg} alt="" className="nw-faq__promo-img" loading="lazy" />
            <div className="nw-faq__promo-copy">
              <span className="nw-faq__promo-arrow" aria-hidden="true">
                <svg width="46" height="42" viewBox="0 0 46 42" fill="none">
                  <path d="M41 5C36 18 23 27 5 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M13 28L4 33L10 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="nw-faq__promo-text">Still have questions?</p>
              <p className="nw-faq__promo-sub">We&rsquo;re here to help!</p>
              <Link to="/faq" className="nw-faq__promo-cta" id="nw-faq-promo-cta">
                View All FAQs
                <ArrowRight size={14} strokeWidth={2.6} />
              </Link>
            </div>
          </div>

          <div className={`nw-faq__grid${inView ? " nw-in" : ""}`} ref={ref}>
            {faqs.map(({ id, Icon, q, a }, i) => {
              const open = openId === id;
              return (
                <div
                  className={`nw-faq__item${open ? " nw-open" : ""}`}
                  key={id} id={id}
                  style={{ "--i": i }}
                >
                  <button
                    className="nw-faq__question"
                    id={`${id}-btn`}
                    aria-expanded={open}
                    aria-controls={`${id}-answer`}
                    onClick={() => toggle(id)}
                  >
                    <span className="nw-faq__question-icon" aria-hidden="true">
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span className="nw-faq__question-text">{q}</span>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className="nw-faq__chevron"
                    />
                  </button>
                  <div
                    className="nw-faq__answer"
                    id={`${id}-answer`}
                    role="region"
                    aria-labelledby={`${id}-btn`}
                  >
                    <p>{a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FaqSection;
