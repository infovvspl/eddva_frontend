// FounderSection.jsx — /about — "Our Founder"
// Photo (placeholder avatar until a real headshot is supplied — see
// data/team.js) beside the bio and a pull-quote, with a handwritten aside.

import { Quote } from "lucide-react";
import { founder } from "../data/team";
import getInitials from "../utils/initials";
import useInView from "../hooks/useInView";

const FounderSection = () => {
  const [ref, inView] = useInView({ threshold: 0.25 });

  return (
    <section className="nw-founder" id="nw-founder" ref={ref}>
      <span className="nw-founder__blob" aria-hidden="true" />
      <span className="nw-founder__dots" aria-hidden="true" />
      <div className={`nw-founder__container${inView ? " nw-in" : ""}`}>

        <figure className="nw-founder__photo">
          {founder.photo ? (
            <img src={founder.photo} alt={founder.name} loading="lazy" />
          ) : (
            <span className="nw-founder__avatar" aria-hidden="true">
              {getInitials(founder.name)}
            </span>
          )}
          <figcaption className="nw-founder__caption">
            <strong>{founder.name}</strong>
            <span>{founder.role}</span>
          </figcaption>
        </figure>

        <div className="nw-founder__body">
          <span className="nw-founder__label">Our Founder</span>
          <h2 className="nw-founder__heading">
            Driven by Purpose.<br />
            Committed to <span className="nw-founder__heading-accent">Education.</span>
          </h2>
          <p className="nw-founder__bio">{founder.bio}</p>

          <blockquote className="nw-founder__quote">
            <Quote size={22} strokeWidth={1.8} className="nw-founder__quote-icon" aria-hidden="true" />
            <p>&ldquo;{founder.quote}&rdquo;</p>
            <cite>&mdash; {founder.name}</cite>
          </blockquote>
        </div>

        <p className="nw-founder__note" aria-hidden="true">
          Innovate<br />Educate<br />Empower
        </p>

      </div>
    </section>
  );
};

export default FounderSection;
