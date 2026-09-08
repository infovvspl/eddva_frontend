// FaqCategoryAccordion.jsx — /faq
// One category's question list. Only one answer open at a time within a
// category — the pattern the original FaqSection already used — but switching
// categories does not close what's open elsewhere (there's only ever one
// category visible at once anyway, via the pills above it).

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FaqCategoryAccordion = ({ category }) => {
  const [openIndex, setOpenIndex] = useState(0);
  const toggle = i => setOpenIndex(prev => (prev === i ? -1 : i));

  return (
    <div className="nw-faqp__list">
      {category.questions.map(({ q, a, list, after }, i) => {
        const open = openIndex === i;
        return (
          <div className={`nw-faqp__item${open ? " nw-open" : ""}`} key={q}>
            <button
              type="button"
              className="nw-faqp__question"
              id={`nw-faqp-${category.id}-${i}-btn`}
              aria-expanded={open}
              aria-controls={`nw-faqp-${category.id}-${i}-answer`}
              onClick={() => toggle(i)}
            >
              <span>{q}</span>
              <ChevronDown size={18} strokeWidth={2} className="nw-faqp__chevron" />
            </button>
            <div
              className="nw-faqp__answer"
              id={`nw-faqp-${category.id}-${i}-answer`}
              role="region"
              aria-labelledby={`nw-faqp-${category.id}-${i}-btn`}
            >
              <div className="nw-faqp__answer-inner">
                <p>{a}</p>
                {list && (
                  <ul className="nw-faqp__sublist">
                    {list.map(item => <li key={item}>{item}</li>)}
                  </ul>
                )}
                {after && <p>{after}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqCategoryAccordion;
