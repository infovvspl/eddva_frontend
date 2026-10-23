// AchievementsSection.jsx — New Website Mockup
// "OUR ACHIEVEMENTS — Recognized for Excellence" credential badges

import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import { achievements as achievementsData } from "../data/achievements";
import useInView from "../hooks/useInView";


const AchievementsSection = () => {
  const { t } = useTranslation("home");
  const achievements = useLocalized("data-achievements", achievementsData);
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="nw-achievements" id="nw-achievements">
      <div className="nw-achievements__container">

        <div className="nw-achievements__header">
          <span className="nw-achievements__label">{t("achievements.label")}</span>
          <h2 className="nw-achievements__heading">{t("achievements.heading")}</h2>
        </div>

        <div className={`nw-achievements__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {achievements.map(({ id, title, subtitle, Icon, color, bg, ring }, i) => (
            <div className="nw-achievements__card" key={id} id={id} style={{ "--i": i }}>
              <div
                className="nw-achievements__badge"
                style={{ background: bg, color, borderColor: ring }}
              >
                <Icon size={30} strokeWidth={1.6} />
              </div>
              <span className="nw-achievements__title">{title}</span>
              <span className="nw-achievements__subtitle">{subtitle}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AchievementsSection;
