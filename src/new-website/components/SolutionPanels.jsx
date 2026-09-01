// SolutionPanels.jsx — /solution
// For Schools / For Institutes as two large tinted panels. Deliberately NOT
// the home page's small side-by-side cards. Copy comes from data/services.js.
//
// The stakeholder rows that used to sit here moved to SolutionDetail, which
// covers each role properly rather than in one line.

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { services } from "../data/services";

const SolutionPanels = () => {
  return (
    <section className="nw-panels" id="nw-solution-panels">
      <div className="nw-panels__container">

        {/* Two big panels */}
        <div className="nw-panels__pair">
          {services.map(({ id, title, desc, Icon, color, bg }) => (
            <article
              className="nw-panels__panel"
              key={id}
              id={`${id}-panel`}
              style={{ "--nw-panel-accent": color, "--nw-panel-bg": bg }}
            >
              <span className="nw-panels__glyph" aria-hidden="true">
                <Icon size={64} />
              </span>
              <h2 className="nw-panels__title">{title}</h2>
              <p className="nw-panels__desc">{desc}</p>
              <Link to="/contact" className="nw-panels__cta" id={`${id}-panel-cta`}>
                Talk to us
                <ArrowRight size={15} strokeWidth={2.4} />
              </Link>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SolutionPanels;
