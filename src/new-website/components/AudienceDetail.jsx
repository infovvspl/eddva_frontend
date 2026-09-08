// AudienceDetail.jsx — /solution/institutions
// The full-detail version of an audience panel (Institute, School or
// University): the watermark treatment from SolutionAudience's hub panel,
// but with room to breathe. Institutions, Schools and Universities all stack
// on the one combined page now, each its own instance of this component, so
// the title renders as h2 (the page itself owns the h1) and each instance
// needs its own section id for anchor links to land on the right one.
//
// Takes one entry from data/services.js `services`.

import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import useInView from "../hooks/useInView";

const AudienceDetail = ({ audience, id = "nw-audience-detail" }) => {
  const { title, desc, covers, Icon, color, bg } = audience;
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section
      className={`nw-auddet${inView ? " nw-in" : ""}`}
      id={id}
      ref={ref}
      style={{ "--nw-aud-accent": color, "--nw-aud-bg": bg }}
    >
      <span className="nw-auddet__watermark" aria-hidden="true">
        <Icon size={320} />
      </span>

      <div className="nw-auddet__container">
        <span className="nw-auddet__mark" aria-hidden="true">
          <Icon size={40} />
        </span>
        <h2 className="nw-auddet__title">{title}</h2>
        <p className="nw-auddet__desc">{desc}</p>

        <ul className="nw-auddet__covers">
          {covers.map(item => (
            <li className="nw-auddet__cover" key={item}>
              <span className="nw-auddet__tick" aria-hidden="true">
                <Check size={13} strokeWidth={3.4} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link to="/contact" className="nw-auddet__cta" id={`${id}-cta`}>
          Talk to us
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
};

export default AudienceDetail;
