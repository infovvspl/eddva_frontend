// AboutStoryLink.jsx — /about
// Closes the About page with a teaser pointing to the full narrative, now
// its own page at /about/story (see AboutStoryPage.jsx). The heading and
// opening line are the story's own signed-off copy, reused verbatim; only
// the "Read our story" link is new.

import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake } from "lucide-react";
import useInView from "../hooks/useInView";

const AboutStoryLink = () => {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="nw-storylink" id="nw-about-story-link">
      <div className={`nw-storylink__card${inView ? " nw-in" : ""}`} ref={ref}>
        <span className="nw-storylink__icon" aria-hidden="true">
          <HeartHandshake size={24} strokeWidth={1.8} />
        </span>
        <span className="nw-section-label">About Us</span>
        <h2 className="nw-storylink__heading">Empowering Education. Enriching Futures.</h2>
        <p className="nw-storylink__lead">
          Education has always been about more than technology. It is about a
          teacher who inspires, a student who discovers, a parent who
          supports, and an institution that nurtures potential.
        </p>
        <Link to="/about/story" className="nw-storylink__cta" id="nw-about-story-cta">
          Read our story
          <ArrowRight size={15} strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
};

export default AboutStoryLink;
