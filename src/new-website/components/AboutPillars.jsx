// AboutPillars.jsx — /about
// The four About capabilities as a numbered editorial list beside a sticky
// intro column. Deliberately NOT the home page's four-up card grid — same
// copy from data/about.js, different layout.

import aboutHome from "../assets/abouthome.png";
import { aboutCards } from "../data/about";
import useInView from "../hooks/useInView";

/* Each row watches itself, so the list reveals as you scroll rather than all
   at once when the section's top edge appears. */
const Row = ({ card, index }) => {
  const { id, title, desc, Icon, color, bg } = card;
  const [ref, inView] = useInView({ threshold: 0.4 });

  return (
    <li
      ref={ref}
      className={`nw-pillars__row${inView ? " nw-in" : ""}`}
      id={`${id}-pillar`}
      style={{ "--nw-pillar-accent": color }}
    >
      <span className="nw-pillars__num" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="nw-pillars__body">
        <div className="nw-pillars__row-head">
          <span
            className="nw-pillars__icon"
            style={{ background: bg, color }}
            aria-hidden="true"
          >
            <Icon size={19} strokeWidth={1.8} />
          </span>
          <h3 className="nw-pillars__title">{title}</h3>
        </div>
        <p className="nw-pillars__desc">{desc}</p>
      </div>
    </li>
  );
};

const AboutPillars = () => {
  return (
    <section className="nw-pillars" id="nw-about-pillars">
      <div className="nw-pillars__container">

        {/* LEFT — stays put while the list scrolls past it */}
        <div className="nw-pillars__intro">
          <h2 className="nw-pillars__heading">
            Empowering Education.<br />
            Enriching <span className="nw-pillars__heading-accent">Futures.</span>
          </h2>
          <figure className="nw-pillars__media">
            <img
              src={aboutHome}
              alt="A teacher presenting the EDDVA dashboard on a classroom display"
              loading="lazy"
            />
          </figure>
        </div>

        {/* RIGHT — numbered rows */}
        <ol className="nw-pillars__list">
          {aboutCards.map((card, i) => (
            <Row key={card.id} card={card} index={i} />
          ))}
        </ol>

      </div>
    </section>
  );
};

export default AboutPillars;
