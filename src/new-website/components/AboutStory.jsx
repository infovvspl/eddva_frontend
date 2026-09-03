// AboutStory.jsx — /about
// The full "About Us" narrative — signed-off copy, supplied verbatim (only
// line breaks and paragraph grouping are mine): what EDDVA is, why it exists,
// then Our Vision and Our Promise as two closing cards.
//
// The three short lines ("Because we believe...") are kept as their own
// paragraph with line breaks rather than run together — they read as a
// deliberate triplet in the source copy, and collapsing them into one
// sentence would flatten that rhythm.

import { Eye, HeartHandshake } from "lucide-react";
import useInView from "../hooks/useInView";

const AboutStory = () => {
  const [ref, inView] = useInView({ threshold: 0.08 });

  return (
    <section className="nw-story" id="nw-about-story">
      <div className="nw-story__container">

        <header className="nw-story__header">
          <span className="nw-story__label">About Us</span>
          <h2 className="nw-story__heading">
            Empowering Education. Enriching{" "}
            <span className="nw-story__heading-accent">Futures.</span>
          </h2>
        </header>

        <div className={`nw-story__body${inView ? " nw-in" : ""}`} ref={ref}>
          <p className="nw-story__p">
            Education has always been about more than technology. It is about
            a teacher who inspires, a student who discovers, a parent who
            supports, and an institution that nurtures potential.
          </p>

          <p className="nw-story__p">
            EDDVA &ndash; Education Development &amp; Advancement was born
            from a simple belief: the future of education should not replace
            the foundations of teaching, it should strengthen them.
          </p>

          <p className="nw-story__p">
            We bring together the essence of traditional teaching with the
            intelligence of AI, creating an education ecosystem where
            technology works alongside educators, not in place of them.
          </p>

          <p className="nw-story__p">
            From AI-powered personalised learning and intelligent assessments
            to smart school management, analytics and seamless communication,
            EDDVA connects students, teachers, parents and institutions on one
            intelligent platform.
          </p>

          <p className="nw-story__p">
            Our AI helps understand how students learn, supports teachers in
            delivering more effective education, gives parents meaningful
            visibility into their child&rsquo;s journey, and empowers
            institutions with the insights and tools to make better
            decisions.
          </p>

          <p className="nw-story__triplet">
            Because we believe every learner is different.<br />
            Every teacher has a unique way of teaching.<br />
            And every institution has its own vision for excellence.
          </p>

          <p className="nw-story__p nw-story__p--closing">
            EDDVA brings the intelligence of technology to education while
            keeping the human connection at its heart.
          </p>
        </div>

        <div className={`nw-story__cards${inView ? " nw-in" : ""}`}>
          <article className="nw-story__card" id="nw-story-vision">
            <span className="nw-story__card-icon" aria-hidden="true">
              <Eye size={26} strokeWidth={1.8} />
            </span>
            <h3 className="nw-story__card-title">Our Vision</h3>
            <p className="nw-story__card-desc">
              To build a future where every learner receives personalised
              support, every educator is empowered to teach better, and every
              institution has the intelligence to create meaningful
              educational outcomes.
            </p>
          </article>

          <article className="nw-story__card" id="nw-story-promise">
            <span className="nw-story__card-icon" aria-hidden="true">
              <HeartHandshake size={26} strokeWidth={1.8} />
            </span>
            <h3 className="nw-story__card-title">Our Promise</h3>
            <p className="nw-story__card-desc">
              We don&rsquo;t aim to make education more technological.<br />
              We aim to make technology make education better.
            </p>
          </article>
        </div>

      </div>
    </section>
  );
};

export default AboutStory;
