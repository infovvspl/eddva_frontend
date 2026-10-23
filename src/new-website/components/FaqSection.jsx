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
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";
import faqPromoImg from "../assets/contactpageasset.png";

const faqs = [
  {
    id: "nw-faq-what",
    Icon: HelpCircle,
  },
  {
    id: "nw-faq-secure",
    Icon: ShieldCheck,
  },
  {
    id: "nw-faq-who",
    Icon: Building2,
  },
  {
    id: "nw-faq-custom",
    Icon: SlidersHorizontal,
  },
  {
    id: "nw-faq-training",
    Icon: GraduationCap,
  },
  {
    id: "nw-faq-start",
    Icon: Rocket,
  },
];

const FaqSection = () => {
  const { t } = useTranslation("contact");
  const [openId, setOpenId] = useState(null);
  const [ref, inView] = useInView({ threshold: 0.1 });

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id));

  return (
    <section className="nw-faq" id="nw-faq">
      <div className="nw-faq__container">

        <div className="nw-faq__header">
          <span className="nw-faq__label">{t("faq.label")}</span>
          <h2 className="nw-faq__heading">{t("faq.heading")}</h2>
          <p className="nw-faq__sub">
            {t("faq.sub")}
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
              <p className="nw-faq__promo-text">{t("faq.still")}</p>
              <p className="nw-faq__promo-sub">{t("faq.help")}</p>
              <Link to="/faq" className="nw-faq__promo-cta" id="nw-faq-promo-cta">
                {t("faq.viewAll")}
                <ArrowRight size={14} strokeWidth={2.6} />
              </Link>
            </div>
          </div>

          <div className={`nw-faq__grid${inView ? " nw-in" : ""}`} ref={ref}>
            {faqs.map(({ id, Icon }, i) => {
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
                    <span className="nw-faq__question-text">{t(`faq.items.${id}.q`)}</span>
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
                    <p>{t(`faq.items.${id}.a`)}</p>
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
