// FeatureDetail.jsx — /features/:slug
// One feature's own page: artwork and intro, what it actually does, who uses
// it, then the other features in the same category.
//
// Rendered for whichever feature the route resolved; the page component handles
// an unknown slug before this ever mounts.

import { Link } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft, Users } from "lucide-react";
import { features, featureCategories } from "../data/features";
import useInView from "../hooks/useInView";

const FeatureDetail = ({ feature }) => {
  const { slug, title, tagline, intro, img, cat, roles, highlights } = feature;
  const category = featureCategories.find(c => c.id === cat);
  const [ref, inView] = useInView({ threshold: 0.08 });

  // Same category first, then anything else, so "related" means something
  const related = [
    ...features.filter(f => f.cat === cat && f.slug !== slug),
    ...features.filter(f => f.cat !== cat),
  ].slice(0, 3);

  return (
    <div
      className="nw-fdet"
      style={{ "--nw-f-accent": category.accent, "--nw-f-bg": category.bg }}
    >
      {/* ── Overview ── */}
      <section className="nw-fdet__hero" id={`nw-feature-${slug}`}>
        <div className="nw-fdet__hero-inner">
          <div className="nw-fdet__hero-copy">
            <Link to="/features" className="nw-fdet__back">
              <ArrowLeft size={15} strokeWidth={2.4} />
              All features
            </Link>
            <span className="nw-fdet__tag">{category.label}</span>
            <h1 className="nw-fdet__title">{title}</h1>
            <p className="nw-fdet__tagline">{tagline}</p>
            <p className="nw-fdet__intro">{intro}</p>

            <div className="nw-fdet__roles">
              <span className="nw-fdet__roles-label">
                <Users size={14} strokeWidth={2.1} aria-hidden="true" />
                Used by
              </span>
              {roles.map(role => (
                <span className="nw-fdet__role" key={role}>{role}</span>
              ))}
            </div>
          </div>

          <div className="nw-fdet__hero-art" aria-hidden="true">
            <span className="nw-fdet__halo" />
            <img src={img} alt="" className="nw-fdet__img" />
          </div>
        </div>
      </section>

      {/* ── What it does ── */}
      <section className="nw-fdet__body">
        <div className={`nw-fdet__body-inner${inView ? " nw-in" : ""}`} ref={ref}>
          <h2 className="nw-fdet__h2">What it does</h2>
          <ul className="nw-fdet__points">
            {highlights.map((point, i) => (
              <li className="nw-fdet__point" key={point} style={{ "--i": i }}>
                <span className="nw-fdet__tick" aria-hidden="true">
                  <Check size={13} strokeWidth={3.2} />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <div className="nw-fdet__cta-card">
            <div>
              <h3 className="nw-fdet__cta-title">See {title} in your institution</h3>
              <p className="nw-fdet__cta-desc">
                We will walk you through it on your own syllabus and batches.
              </p>
            </div>
            <Link to="/contact" className="nw-fdet__cta" id={`nw-feature-${slug}-cta`}>
              Book a demo
              <ArrowRight size={15} strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      <section className="nw-fdet__related">
        <div className="nw-fdet__related-inner">
          <h2 className="nw-fdet__h2">More features</h2>
          <div className="nw-fdet__related-grid">
            {related.map(item => {
              const itemCat = featureCategories.find(c => c.id === item.cat);
              return (
                <Link
                  to={`/features/${item.slug}`}
                  className="nw-fdet__related-card"
                  key={item.id}
                  style={{ "--nw-f-accent": itemCat.accent, "--nw-f-bg": itemCat.bg }}
                >
                  <span className="nw-fdet__related-thumb">
                    <img src={item.img} alt="" loading="lazy" />
                  </span>
                  <span className="nw-fdet__related-copy">
                    <span className="nw-fdet__related-title">{item.title}</span>
                    <span className="nw-fdet__related-tagline">{item.tagline}</span>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.4} className="nw-fdet__related-arrow" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeatureDetail;
