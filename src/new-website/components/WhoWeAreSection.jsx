// WhoWeAreSection.jsx — New Website Mockup
// "Who We Are?" — segment coverage + student photo with floating badges

import { GraduationCap, Users } from "lucide-react";
// Placeholder until a "students with a laptop" photo is supplied —
// swap this one import to change the picture.
import studentsImg from "../../assets/student_gen.jpg";

const segments = [
  "Preschools", "Play Schools", "Schools (KG–12)", "CBSE", "ICSE",
  "State Boards", "Coaching Centres", "Educational Institutes",
  "Colleges", "Universities",
];

const WhoWeAreSection = () => {
  return (
    <section className="nw-who" id="nw-who">
      <div className="nw-who__dots nw-who__dots--1" aria-hidden="true" />
      <div className="nw-who__dots nw-who__dots--2" aria-hidden="true" />
      <div className="nw-who__blob" aria-hidden="true" />
      <span className="nw-who__accent-dot" aria-hidden="true" />

      <div className="nw-who__container">

        {/* LEFT — copy */}
        <div className="nw-who__left">
          <h2 className="nw-who__heading" id="nw-who-heading">
            <span className="nw-who__heading--accent">Who</span> We Are?
          </h2>

          <p className="nw-who__lead">We&rsquo;re Built for Every Educational Segment</p>

          <p className="nw-who__desc">
            From Preschool to University, EDDVA is designed to meet
            the evolving needs of every educational institution.
          </p>

          <p className="nw-who__segments" id="nw-who-segments">
            {segments.map((seg, i) => (
              <span key={seg}>
                {seg}
                {i < segments.length - 1 && (
                  <span className="nw-who__sep" aria-hidden="true"> • </span>
                )}
              </span>
            ))}
          </p>

          <p className="nw-who__closing">
            One Powerful Platform. Every Educational Need. &mdash; EDDVA
          </p>
        </div>

        {/* RIGHT — image with floating badges */}
        <div className="nw-who__image-wrap" id="nw-who-image-wrap">
          <div className="nw-who__image-bg" aria-hidden="true" />
          <img
            src={studentsImg}
            alt="Students learning together on a laptop"
            className="nw-who__image"
            id="nw-who-img"
          />

          <div className="nw-who__badge nw-who__badge--left" id="nw-who-badge-learning">
            <GraduationCap size={26} strokeWidth={1.7} />
            <span>Better Learning</span>
          </div>

          <div className="nw-who__badge nw-who__badge--right" id="nw-who-badge-together">
            <Users size={26} strokeWidth={1.7} />
            <span>Stronger Together</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhoWeAreSection;
