// AiFeaturesSection.jsx — New Website Mockup
// "Discover Our Top AI Features" — auto-scrolling marquee of labelled cards.
//
// The current artwork carries no baked-in caption, so each title is printed
// under its illustration and the image itself is decorative (alt="").
// Each card links to that feature's own page under /features/.
// The strip is rendered twice so the loop is seamless; the second copy is
// aria-hidden so screen readers only announce each feature once.

import { Link } from "react-router-dom";
import { features } from "../data/features";


const Strip = ({ clone }) => (
  <div className="nw-marquee__group" aria-hidden={clone || undefined}>
    {features.map(({ id, slug, title, img }) => (
      <Link
        to={`/features/${slug}`}
        className="nw-aifeat__item"
        key={id}
        id={clone ? undefined : id}
        // The clone is aria-hidden, so keep it out of the tab order too
        tabIndex={clone ? -1 : undefined}
      >
        <span className="nw-aifeat__thumb">
          <img
            src={img}
            alt=""
            className="nw-aifeat__img"
            loading="lazy"
            draggable="false"
          />
        </span>
        <h3 className="nw-aifeat__title">{title}</h3>
      </Link>
    ))}
  </div>
);

const AiFeaturesSection = () => {
  return (
    <section className="nw-aifeat nw-bg-frame" id="nw-ai-features">
      <div className="nw-aifeat__container">

        <h2 className="nw-aifeat__heading" id="nw-aifeat-heading">
          Discover Our Top AI Features
        </h2>

        <div className="nw-marquee nw-marquee--features" id="nw-aifeat-marquee">
          <div className="nw-marquee__track">
            <Strip />
            <Strip clone />
          </div>
        </div>

      </div>
    </section>
  );
};

export default AiFeaturesSection;
