// AboutSection.jsx — New Website Mockup
// Uses lucide-react icons

import { Sparkles } from "lucide-react";
import aboutHome from "../assets/abouthome.png";
import { aboutCards as cards } from "../data/about";


const AboutSection = () => {
  return (
    <section className="nw-about" id="nw-about">
      <div className="nw-about__container">

        {/* LEFT — Text content */}
        <div className="nw-about__left">
          <span className="nw-about__label" id="nw-about-label">
            <span className="nw-about__label-icon" aria-hidden="true">
              <Sparkles size={13} strokeWidth={2.2} />
            </span>
            ABOUT US
          </span>
          <h2 className="nw-about__heading" id="nw-about-heading">
            Empowering Education.<br />
            Enriching <span className="nw-about__heading-accent">Futures.</span>
          </h2>
          <p className="nw-about__desc" id="nw-about-desc">
            EDDVA is a next generation platform built for the future of
            education. We combine AI, automation and analytics to deliver
            personalised learning, simplify school operations and create
            better outcomes for every stakeholder.
          </p>
          <p className="nw-about__desc" id="nw-about-desc-2">
            By bringing students, teachers, parents and school management
            together on one intelligent ecosystem, EDDVA makes education
            smarter, more connected and more impactful.
          </p>
          <p className="nw-about__tagline" id="nw-about-tagline">
            Learn Smarter. Teach Better. Grow Together.
          </p>
        </div>

        {/* RIGHT — Classroom render */}
        <div className="nw-about__right">
          <figure className="nw-about__media">
            <img
              src={aboutHome}
              alt="A teacher presenting the EDDVA dashboard on a classroom display"
              loading="lazy"
            />
          </figure>
        </div>

        {/* FULL WIDTH — Feature cards span the whole container */}
        <div className="nw-about__cards" id="nw-about-cards">
          {cards.map(({ id, title, desc, Icon, color, bg }) => (
            <div
              className="nw-about__card"
              key={id}
              id={id}
              style={{ "--nw-about-accent": color }}
            >
              <div
                className="nw-about__card-icon"
                style={{ background: bg, color: color }}
              >
                <Icon size={28} strokeWidth={1.6} />
              </div>
              <h3 className="nw-about__card-title">{title}</h3>
              <p className="nw-about__card-desc">{desc}</p>
              <span className="nw-about__card-bar" aria-hidden="true" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
