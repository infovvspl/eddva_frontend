// SolutionAudience.jsx — /solution
// "Which one are you?" — schools, institutes and universities as split
// panels, each with its glyph set large as a watermark behind the copy and
// the four things that panel actually covers listed underneath.
//
// Replaces the plain tinted panels that were here before. Copy comes from
// data/services.js.

import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { services } from "../data/services";
import useInView from "../hooks/useInView";

// Institutes, Schools and Universities all get their full breakdown on the
// one combined page (pages/InstitutionSolutionPage) — each panel here links
// to its own section there via hash. Teachers, Students and Parents each
// have a full dedicated page of their own instead.
const DEDICATED_PAGE = {
  "nw-svc-institutes": "/solution/institutions#nw-svc-institutes",
  "nw-svc-schools": "/solution/institutions#nw-svc-schools",
  "nw-svc-universities": "/solution/institutions#nw-svc-universities",
};

const Panel = ({ service, index }) => {
  const { id, title, desc, covers, Icon, color, bg } = service;
  const dedicatedPage = DEDICATED_PAGE[id];
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

        <div className="nw-aud__actions">
          {dedicatedPage && (
            <Link to={dedicatedPage} className="nw-aud__more" id={`${id}-audience-more`}>
              Full breakdown
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          )}
          <Link to="/contact" className="nw-aud__cta" id={`${id}-audience-cta`}>
            Talk to us
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </article>
  );
};

const SolutionAudience = () => {
  return (
    <section className="nw-aud" id="nw-solution-audience">
      <div className="nw-aud__container">

        <header className="nw-aud__header">
          <h2 className="nw-aud__heading">Built for Every Kind of Institution</h2>
          <p className="nw-aud__lead">
            The same platform, configured around how your institution actually
            runs — a school day, a coaching timetable or a university semester.
          </p>
        </header>

        <div className="nw-aud__pair nw-aud__pair--triple">
          {services.map((service, i) => (
            <Panel key={service.id} service={service} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default SolutionAudience;
