// FeatureIndex.jsx — /features
// Every AI feature as a card linking to its own page, with a category filter
// above the grid.
//
// The filter is plain state rather than a URL param — it is a convenience for
// scanning, not a destination worth linking to. The counts come from the data
// so a new feature cannot desync them.

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { features, featureCategories } from "../data/features";
import useInView from "../hooks/useInView";

const ALL = "all";

const FeatureIndex = () => {
  const [filter, setFilter] = useState(ALL);
  const [ref, inView] = useInView({ threshold: 0.05 });

  const shown = filter === ALL ? features : features.filter(f => f.cat === filter);

  const tabs = [
    { id: ALL, label: "All features", accent: "#1a56db", count: features.length },
    ...featureCategories.map(c => ({
      ...c,
      count: features.filter(f => f.cat === c.id).length,
    })),
  ];

  return (
    <section className="nw-findex" id="nw-features-index">
      <div className="nw-findex__container">

        <div className="nw-findex__filters" role="group" aria-label="Filter features">
          {tabs.map(({ id, label, accent, count }) => (
            <button
              type="button"
              key={id}
              id={`nw-ffilter-${id}`}
              className={`nw-findex__filter${filter === id ? " nw-on" : ""}`}
              style={{ "--nw-f-accent": accent }}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
              <span className="nw-findex__filter-count">{count}</span>
            </button>
          ))}
        </div>

        <div className={`nw-findex__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {shown.map(({ id, slug, title, tagline, img, cat }, i) => {
            const category = featureCategories.find(c => c.id === cat);
            return (
              <Link
                to={`/features/${slug}`}
                className="nw-findex__card"
                key={id}
                id={`${id}-card`}
                style={{ "--i": i, "--nw-f-accent": category.accent, "--nw-f-bg": category.bg }}
              >
                <span className="nw-findex__thumb">
                  <img src={img} alt="" className="nw-findex__img" loading="lazy" />
                </span>
                <span className="nw-findex__tag">{category.label}</span>
                <h3 className="nw-findex__title">{title}</h3>
                <p className="nw-findex__tagline">{tagline}</p>
                <span className="nw-findex__more">
                  Read more
                  <ArrowRight size={14} strokeWidth={2.6} />
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FeatureIndex;
