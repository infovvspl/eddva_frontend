// AiFeatureChecklist.jsx — /new-website/products
// The nine AI features as a static three-column list of hairline-separated
// rows — nothing scrolls, everything is readable at once. Deliberately NOT the
// home page's marquee. Copy and artwork come from data/features.js.

import { features } from "../data/features";

const AiFeatureChecklist = () => {
  return (
    <section className="nw-checklist" id="nw-ai-checklist">
      <div className="nw-checklist__container">

        <h2 className="nw-checklist__heading">Discover Our Top AI Features</h2>

        <ul className="nw-checklist__grid">
          {features.map(({ id, title, img }) => (
            <li className="nw-checklist__item" key={id} id={`${id}-row`}>
              <span className="nw-checklist__thumb">
                <img src={img} alt="" className="nw-checklist__img" loading="lazy" />
              </span>
              <span className="nw-checklist__title">{title}</span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};

export default AiFeatureChecklist;
