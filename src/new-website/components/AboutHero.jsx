// AboutHero.jsx — /about
// Full-bleed banner: bgabout.png sits as the section's own background
// (cover, not a side column), with the breadcrumb + title + lead + "Our
// Story" link overlaid on its light left side. Deliberately not the shared
// PageHead (which renders a stat strip instead of a photo) — this page
// wants the photo treatment the reference design uses.
//
// bgabout.png is a finished graphic, not a plain photo: the arc, the glow
// and the "Education today, a brighter tomorrow!" caption with its paper
// plane are already composited into the image itself, so there's no
// separate CSS arc/glow/caption layer here the way the home hero has one.
// A left-to-right white wash (.nw-abouthero__scrim) sits between the
// background and the text so the copy stays readable regardless of what's
// under it in the photo.

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, GraduationCap } from "lucide-react";
import aboutBannerEn from "../assets/bgabout.png";
import aboutBannerHi from "../assets/bgabout.hi.webp";

const AboutHero = () => {
  const { t, i18n } = useTranslation(["about", "common"]);
  const aboutBanner = i18n.language === "hi" ? aboutBannerHi : aboutBannerEn;
  return (
  <section
    className="nw-abouthero"
    id="nw-about-head"
    style={{ "--nw-abouthero-bg": `url(${aboutBanner})` }}
  >
    <span className="nw-abouthero__scrim" aria-hidden="true" />
    <div className="nw-abouthero__container">

      <div className="nw-abouthero__content">
        <nav className="nw-abouthero__crumbs nw-rise" style={{ "--nw-delay": "0s" }} aria-label={t("common:pageHead.breadcrumb")}>
          <Link to="/" className="nw-abouthero__crumb">{t("common:pageHead.home")}</Link>
          <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
          <span className="nw-abouthero__crumb nw-abouthero__crumb--current" aria-current="page">
            {t("hero.crumb")}
          </span>
          <GraduationCap size={18} strokeWidth={1.8} className="nw-abouthero__crumb-icon" aria-hidden="true" />
        </nav>

        <h1 className="nw-abouthero__title nw-rise" style={{ "--nw-delay": "0.08s" }}>
          {t("hero.titlePre")}<span className="nw-abouthero__title-accent">{t("hero.titleAccent")}</span>
        </h1>

        <p className="nw-abouthero__lead nw-rise" style={{ "--nw-delay": "0.16s" }}>
          {t("hero.lead")}
        </p>

        <Link
          to="/about/story"
          className="nw-abouthero__btn nw-rise"
          id="nw-abouthero-story"
          style={{ "--nw-delay": "0.24s" }}
        >
          {t("hero.storyBtn")}
          <ChevronRight size={16} strokeWidth={2.4} />
        </Link>
      </div>

    </div>
  </section>
  );
};

export default AboutHero;
