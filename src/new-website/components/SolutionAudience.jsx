// SolutionAudience.jsx — /solution
// "Which one are you?" — schools and institutes as two split panels, each with
// its glyph set large as a watermark behind the copy and the four things that
// panel actually covers listed underneath.
//
// Replaces the plain tinted panels that were here before. Copy comes from
// data/services.js.

import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { services } from "../data/services";
import useInView from "../hooks/useInView";

const Panel = ({ service, index }) => {
  const { id, title, desc, covers, Icon, color, bg } = service;
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <article
      ref={ref}
      id={`${id}-audience`}
      className={`nw-aud__panel${inView ? " nw-in" : ""}`}
      style={{ "--i": index, "--nw-aud-accent": color, "--nw-aud-bg": bg }}
    >
      {/* Oversized glyph sits behind the copy as a watermark */}
      <span className="nw-aud__watermark" aria-hidden="true">
        <Icon size={210} />
      </span>

      <div className="nw-aud__body">
        <span className="nw-aud__mark" aria-hidden="true">
          <Icon size={34} />
        </span>
        <h3 className="nw-aud__title">{title}</h3>
        <p className="nw-aud__desc">{desc}</p>

        <ul className="nw-aud__covers">
          {covers.map(item => (
            <li className="nw-aud__cover" key={item}>
              <span className="nw-aud__tick" aria-hidden="true">
                <Check size={11} strokeWidth={3.4} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link to="/contact" className="nw-aud__cta" id={`${id}-audience-cta`}>
          Talk to us
          <ArrowRight size={15} strokeWidth={2.5} />
        </Link>
      </div>
    </article>
  );
};

const SolutionAudience = () => {
  return (
    <section className="nw-aud" id="nw-solution-audience">
      <div className="nw-aud__container">

        <header className="nw-aud__header">
          <h2 className="nw-aud__heading">Built for Both Kinds of Institution</h2>
          <p className="nw-aud__lead">
            The same platform, configured around how your institution actually
            runs — whether that is a school day or a coaching timetable.
          </p>
        </header>

        <div className="nw-aud__pair">
          {services.map((service, i) => (
            <Panel key={service.id} service={service} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default SolutionAudience;
