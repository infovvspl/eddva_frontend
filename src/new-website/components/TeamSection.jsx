// TeamSection.jsx — /about — "Meet the Team"
// Dark navy band, elevated cards, each member's photo ring and accent bar
// cycling through the site's palette. Placeholder initials avatars until
// real headshots land where data/team.js still has photo: null.

import { team } from "../data/team";
import getInitials from "../utils/initials";
import useInView from "../hooks/useInView";

// Cycles across members so a 5- or 6-person roster never repeats a
// neighbour's color; matches the palette already used across the site
// (About pillars, Values grid).
const PALETTE = [
  { color: "#2563eb", bg: "#eaf1fd" },
  { color: "#7c3aed", bg: "#f3efff" },
  { color: "#0891b2", bg: "#e6fafd" },
  { color: "#d97706", bg: "#fef3e2" },
  { color: "#16a34a", bg: "#eafaef" },
  { color: "#db2777", bg: "#fdf0f7" },
];

const TeamSection = () => {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <section className="nw-team" id="nw-team">
      <span className="nw-team__glow--1" aria-hidden="true" />
      <span className="nw-team__glow--2" aria-hidden="true" />
      <span className="nw-team__dots" aria-hidden="true" />
      <div className="nw-team__container">

        <header className="nw-team__header">
          <span className="nw-team__label">Our Team</span>
          <h2 className="nw-team__heading">
            Meet the People Behind <span className="nw-team__heading-accent">EDDVA</span>
          </h2>
          <p className="nw-team__sub">
            A passionate team working to transform education through innovation, technology and care.
          </p>
        </header>

        <div className="nw-team__row">
          <ul className={`nw-team__grid${inView ? " nw-in" : ""}`} ref={ref}>
            {team.map((member, i) => {
              const { color, bg } = PALETTE[i % PALETTE.length];
              return (
                <li
                  className="nw-team__card"
                  key={member.id}
                  id={member.id}
                  style={{ "--nw-i": i, "--nw-accent": color }}
                >
                  <span className="nw-team__avatar" style={{ background: bg, color }} aria-hidden="true">
                    {member.photo ? (
                      <img src={member.photo} alt="" loading="lazy" />
                    ) : (
                      getInitials(member.name)
                    )}
                  </span>
                  <strong className="nw-team__name">{member.name}</strong>
                  <span className="nw-team__role">{member.role}</span>
                  <span className="nw-team__accent-bar" style={{ background: color }} aria-hidden="true" />
                </li>
              );
            })}
          </ul>

          <p className="nw-team__note" aria-hidden="true">
            Different<br />Skills<br />One Mission
          </p>
        </div>

      </div>
    </section>
  );
};

export default TeamSection;
