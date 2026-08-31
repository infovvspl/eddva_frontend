// AchievementsSection.jsx — New Website Mockup
// "OUR ACHIEVEMENTS — Recognized for Excellence" credential badges

import { achievements } from "../data/achievements";


const AchievementsSection = () => {
  return (
    <section className="nw-achievements" id="nw-achievements">
      <div className="nw-achievements__container">

        <div className="nw-achievements__header">
          <span className="nw-achievements__label">OUR ACHIEVEMENTS</span>
          <h2 className="nw-achievements__heading">Recognized for Excellence</h2>
        </div>

        <div className="nw-achievements__grid">
          {achievements.map(({ id, title, subtitle, Icon, color, bg, ring }) => (
            <div className="nw-achievements__card" key={id} id={id}>
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
