// TeamSection.jsx — /about — "Meet the Team"
// Light band, a horizontal carousel of tall photo cards with prev/next
// arrows — the layout the user referenced (a partners/team carousel with
// edge-peeking neighbour cards), adapted to the site's light theme rather
// than that reference's dark one. Photo ring/accent still cycles through the
// site's palette, same as before.

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [containerRef, inView] = useInView({ threshold: 0.15 });
  const trackRef = useRef(null);

  const scrollByCards = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".nw-team__card");
    const step = card ? card.getBoundingClientRect().width + 20 : 260;
    track.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section className="nw-team" id="nw-team">
      <span className="nw-team__glow--1" aria-hidden="true" />
      <span className="nw-team__glow--2" aria-hidden="true" />
      <span className="nw-team__dots-bg" aria-hidden="true" />
      <div className={`nw-team__container${inView ? " nw-in" : ""}`} ref={containerRef}>

        <header className="nw-team__header">
          <span className="nw-team__label">Our Team</span>
          <h2 className="nw-team__heading">
            Meet the People Behind <span className="nw-team__heading-accent">EDDVA</span>
          </h2>
          <p className="nw-team__sub">
            A passionate team working to transform education through innovation, technology and care.
          </p>
        </header>

        <div className="nw-team__carousel">
          <button
            type="button"
            className="nw-team__arrow nw-team__arrow--prev"
            onClick={() => scrollByCards(-1)}
            aria-label="Previous team member"
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>

          <ul className="nw-team__track" ref={trackRef}>
            {team.map((member, i) => {
              const { color, bg } = PALETTE[i % PALETTE.length];
              return (
                <li
                  className="nw-team__card"
                  key={member.id}
                  id={member.id}
                  style={{ "--nw-i": i, "--nw-accent": color }}
                >
                  <span className="nw-team__photo">
                    {member.photo ? (
                      <img src={member.photo} alt="" loading="lazy" />
                    ) : (
                      <span className="nw-team__initials" style={{ background: bg, color }} aria-hidden="true">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </span>
                  <strong className="nw-team__name">{member.name}</strong>
                  <span className="nw-team__role" style={{ background: bg, color }}>{member.role}</span>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="nw-team__arrow nw-team__arrow--next"
            onClick={() => scrollByCards(1)}
            aria-label="Next team member"
          >
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        <p className="nw-team__note" aria-hidden="true">
          Different · Skills · One Mission
        </p>

      </div>
    </section>
  );
};

export default TeamSection;
