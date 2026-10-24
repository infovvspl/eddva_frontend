// ContactHero.jsx — /contact
// Wide banner: the wavy blue backdrop, doodle icons and the classroom photo
// are all baked into one supplied image (assets/contactbg.png); this
// component only lays the eyebrow, heading and lead over its left half,
// where the source image leaves room for them. Replaces PageHead on this
// page only — every other sub-page still uses the shared banner.

import { useTranslation } from "react-i18next";
import contactBg from "../assets/contactbg.png";

const ContactHero = () => {
  const { t } = useTranslation("contact");
  return (
  <section
    className="nw-chero"
    id="nw-contact-hero"
    style={{
      // A white-to-transparent fade layered under the photo, so the eyebrow/
      // heading/lead stay legible regardless of how much of the photo a
      // narrow viewport's `background-size: cover` ends up cropping in.
      // Clears fully by 38% on desktop — the source image's doodle icons
      // (cap, book, bulb) sit further right than that, so they stay at full
      // opacity rather than getting washed out under the fade.
      //
      // The two fade stops are CSS custom properties (default: desktop
      // values) so new-website.css can push them out further on narrow
      // viewports, where the lead paragraph loses its max-width and spans
      // close to the full section — at the desktop-sized fade it used to run
      // straight onto the photo, right over the people in it.
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) var(--nw-chero-fade-mid, 22%), rgba(255,255,255,0) var(--nw-chero-fade-end, 38%)), url(${contactBg})`,
    }}
  >
    <div className="nw-chero__container">
      <span className="nw-chero__eyebrow nw-rise" style={{ "--nw-delay": "0s" }}>{t("hero.eyebrow")}</span>
      <h1 className="nw-chero__title nw-rise" style={{ "--nw-delay": "0.08s" }}>
        {t("hero.titlePre")}<span className="nw-chero__title-accent">{t("hero.titleAccent")}</span>
      </h1>
      <span className="nw-chero__title-rule" aria-hidden="true" />
      <p className="nw-chero__lead nw-rise" style={{ "--nw-delay": "0.16s" }}>
        {t("hero.lead")}
      </p>
    </div>
  </section>
  );
};

export default ContactHero;
