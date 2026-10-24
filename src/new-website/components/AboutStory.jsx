// AboutStory.jsx — /about
// The full "About Us" narrative — signed-off copy, supplied verbatim (only
// line breaks and paragraph grouping are mine): what EDDVA is, why it exists,
// then Our Vision and Our Promise as two closing cards.
//
// The three short lines ("Because we believe...") are kept as their own
// paragraph with line breaks rather than run together — they read as a
// deliberate triplet in the source copy, and collapsing them into one
// sentence would flatten that rhythm.

import { Eye, HeartHandshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";

const AboutStory = () => {
  const { t } = useTranslation("about");
  const [ref, inView] = useInView({ threshold: 0.08 });

  return (
    <section className="nw-story" id="nw-about-story">
      <div className="nw-story__container">

        <header className="nw-story__header">
          <span className="nw-story__label">{t("story.label")}</span>
          <h2 className="nw-story__heading">
            {t("story.headingPre")}
            <span className="nw-story__heading-accent">{t("story.headingAccent")}</span>
          </h2>
        </header>

        <div className={`nw-story__body${inView ? " nw-in" : ""}`} ref={ref}>
          <p className="nw-story__p">
            {t("story.p1")}
          </p>

          <p className="nw-story__p">
            {t("story.p2")}
          </p>

          <p className="nw-story__p">
            {t("story.p3")}
          </p>

          <p className="nw-story__p">
            {t("story.p4")}
          </p>

          <p className="nw-story__p">
            {t("story.p5")}
          </p>

          <p className="nw-story__triplet">
            {t("story.triplet1")}<br />
            {t("story.triplet2")}<br />
            {t("story.triplet3")}
          </p>

          <p className="nw-story__p nw-story__p--closing">
            {t("story.closing")}
          </p>
        </div>

        <div className={`nw-story__cards${inView ? " nw-in" : ""}`}>
          <article className="nw-story__card" id="nw-story-vision">
            <span className="nw-story__card-icon" aria-hidden="true">
              <Eye size={26} strokeWidth={1.8} />
            </span>
            <h3 className="nw-story__card-title">{t("story.visionTitle")}</h3>
            <p className="nw-story__card-desc">
              {t("story.visionDesc")}
            </p>
          </article>

          <article className="nw-story__card" id="nw-story-promise">
            <span className="nw-story__card-icon" aria-hidden="true">
              <HeartHandshake size={26} strokeWidth={1.8} />
            </span>
            <h3 className="nw-story__card-title">{t("story.promiseTitle")}</h3>
            <p className="nw-story__card-desc">
              {t("story.promiseLine1")}<br />
              {t("story.promiseLine2")}
            </p>
          </article>
        </div>

      </div>
    </section>
  );
};

export default AboutStory;
