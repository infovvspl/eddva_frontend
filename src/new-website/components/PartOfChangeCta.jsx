// PartOfChangeCta.jsx — /about — closing "Be a Part of the Change" band.
// Replaces AboutStoryLink as this page's closing CTA; AboutStoryLink is kept
// unmounted (still linked to from AboutHero's "Our Story" button) rather than
// deleted, since /about/story is still a real, reachable page.

import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import useInView from "../hooks/useInView";

const PartOfChangeCta = () => {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="nw-change" id="nw-change" ref={ref}>
      <span className="nw-change__glow--1" aria-hidden="true" />
      <span className="nw-change__glow--2" aria-hidden="true" />
      <div className={`nw-change__container${inView ? " nw-in" : ""}`}>

        <p className="nw-change__note" aria-hidden="true">
          Better Tools<br />Brighter<br />Tomorrows!
        </p>

        <div className="nw-change__body">
          <h2 className="nw-change__heading">Be a Part of the Change</h2>
          <p className="nw-change__sub">
            Let&rsquo;s build smarter, more connected learning environments together.
          </p>
          <Link to="/contact" className="nw-change__btn" id="nw-change-btn">
            Get in Touch
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>

        <span className="nw-change__cap" aria-hidden="true">
          <GraduationCap size={54} strokeWidth={1.3} />
        </span>

      </div>
    </section>
  );
};

export default PartOfChangeCta;
