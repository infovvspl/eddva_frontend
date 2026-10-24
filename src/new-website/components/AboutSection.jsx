// AboutSection.jsx — New Website Mockup
// Uses lucide-react icons

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import aboutHomeEn from "../assets/abouthome.webp";
import aboutHomeHi from "../assets/abouthome.hi.webp";
import { aboutCards } from "../data/about";
import useInView from "../hooks/useInView";


const AboutSection = () => {
  const { t, i18n } = useTranslation("home");
  const cards = useLocalized("data-about", aboutCards);
  const [leftRef, leftIn] = useInView({ threshold: 0.2 });
  const [rightRef, rightIn] = useInView({ threshold: 0.2 });
  const [cardsRef, cardsIn] = useInView({ threshold: 0.15 });

  return (
    <section className="nw-about" id="nw-about">
      <div className="nw-about__container">

        {/* LEFT — Text content */}
        <div className={`nw-about__left${leftIn ? " nw-in" : ""}`} ref={leftRef}>
          <span className="nw-about__label" id="nw-about-label">
            <span className="nw-about__label-icon" aria-hidden="true">
              <Sparkles size={13} strokeWidth={2.2} />
            </span>
            {t("about.label")}
          </span>
          <h2 className="nw-about__heading" id="nw-about-heading">
            {t("about.headingLine1")}<br />
            {t("about.headingPre")}<span className="nw-about__heading-accent">{t("about.headingAccent")}</span>
          </h2>
          <p className="nw-about__desc" id="nw-about-desc">
            {t("about.desc1")}
          </p>
          <p className="nw-about__desc" id="nw-about-desc-2">
            {t("about.desc2")}
          </p>
          <p className="nw-about__tagline" id="nw-about-tagline">
            {t("about.tagline")}
          </p>
        </div>

        {/* RIGHT — Classroom render */}
        <div className={`nw-about__right${rightIn ? " nw-in" : ""}`} ref={rightRef}>
          <figure className="nw-about__media">
            <img
              src={i18n.language === "hi" ? aboutHomeHi : aboutHomeEn}
              alt={t("about.imageAlt")}
              loading="lazy"
            />
          </figure>
        </div>

        {/* FULL WIDTH — Feature cards span the whole container */}
        <div className={`nw-about__cards${cardsIn ? " nw-in" : ""}`} id="nw-about-cards" ref={cardsRef}>
          {cards.map(({ id, title, desc, Icon, color, bg }, i) => (
            <div
              className="nw-about__card"
              key={id}
              id={id}
              style={{ "--nw-about-accent": color, "--i": i }}
            >
              <div
                className="nw-about__card-icon"
                style={{ background: bg, color: color }}
              >
                <Icon size={28} strokeWidth={1.6} />
              </div>
              <h3 className="nw-about__card-title">{title}</h3>
              <p className="nw-about__card-desc">{desc}</p>
              <span className="nw-about__card-bar" aria-hidden="true" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
