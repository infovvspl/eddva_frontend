// FaqBrowser.jsx — /faq
// Category pills across the top (85 questions across 10 categories is far too
// many to show flat), then that category's questions as an accordion below.
// Same filter pattern as FeatureIndex's category filter, applied to FAQ.

import { useState } from "react";
import { faqCategories } from "../data/faq";
import FaqCategoryAccordion from "./FaqCategoryAccordion";

const FaqBrowser = () => {
  const [activeId, setActiveId] = useState(faqCategories[0].id);
  const active = faqCategories.find(c => c.id === activeId) || faqCategories[0];

  return (
    <section className="nw-faqp" id="nw-faq-browser">
      <div className="nw-faqp__container">

        <div className="nw-faqp__pills" role="tablist" aria-label="FAQ category">
          {faqCategories.map(({ id, label, questions }) => (
            <button
              type="button"
              key={id}
              role="tab"
              aria-selected={activeId === id}
              className={`nw-faqp__pill${activeId === id ? " nw-on" : ""}`}
              onClick={() => setActiveId(id)}
            >
              {label}
              <span className="nw-faqp__pill-count">{questions.length}</span>
            </button>
          ))}
        </div>

        <div className="nw-faqp__panel" key={active.id}>
          <h2 className="nw-faqp__panel-title">{active.label}</h2>
          <FaqCategoryAccordion category={active} />
        </div>

      </div>
    </section>
  );
};

export default FaqBrowser;
