// TeamSection.jsx — /about — "Meet the Team"
// Five-person grid, placeholder initials avatars until real headshots land
// (see data/team.js).

import { team } from "../data/team";
import getInitials from "../utils/initials";
import useInView from "../hooks/useInView";

const TeamSection = () => {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <section className="nw-team" id="nw-team">
      <span className="nw-team__blob" aria-hidden="true" />
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
            {team.map((member, i) => (
              <li
                className="nw-team__card"
                key={member.id}
                id={member.id}
                style={{ "--nw-i": i }}
              >
                <span className="nw-team__avatar" aria-hidden="true">
                  {member.photo ? (
                    <img src={member.photo} alt="" loading="lazy" />
                  ) : (
                    getInitials(member.name)
                  )}
                </span>
                <strong className="nw-team__name">{member.name}</strong>
                <span className="nw-team__role">{member.role}</span>
              </li>
            ))}
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
