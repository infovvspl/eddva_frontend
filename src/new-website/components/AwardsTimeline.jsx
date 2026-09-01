// AwardsTimeline.jsx — /about
// The same credentials as the home page's badge grid, drawn instead as a
// connected horizontal timeline (it stacks to a vertical rail on narrow
// screens). Copy comes from data/achievements.js.

import { achievements } from "../data/achievements";

const AwardsTimeline = () => {
  return (
    <section className="nw-timeline" id="nw-awards-timeline">
      <div className="nw-timeline__container">

        <h2 className="nw-timeline__heading">Recognized for Excellence</h2>

        <ol className="nw-timeline__track">
          {achievements.map(({ id, title, subtitle, Icon, color, bg, ring }) => (
            <li
              className="nw-timeline__stop"
              key={id}
              id={`${id}-stop`}
              style={{ "--nw-award-accent": color, "--nw-award-ring": ring }}
            >
              <span
                className="nw-timeline__node"
                style={{ background: bg, color }}
                aria-hidden="true"
              >
                <Icon size={24} strokeWidth={1.7} />
              </span>
              <div className="nw-timeline__copy">
                <h3 className="nw-timeline__title">{title}</h3>
                <p className="nw-timeline__subtitle">{subtitle}</p>
              </div>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
};

export default AwardsTimeline;
