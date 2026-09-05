// ModuleAccordion.jsx — /products/erp, /products/lms
// A titled section of modules, each an accordion row: icon, name and
// capability count always visible; the bullet list opens on click. Reused for
// both EDDVA ERP (23 modules) and EDDVA AI Learn (14 modules) — the two
// product breakdowns rich enough that a flat icon-tile grid couldn't show
// their sub-capabilities.
//
// Two rows can be open at once (no accordion-exclusivity) — comparing two
// modules side by side is a reasonable thing to want here.

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const ModuleAccordion = ({ id, heading, headingAccent, lead, modules, defaultOpenId, tinted }) => {
  const [open, setOpen] = useState(() => (defaultOpenId ? { [defaultOpenId]: true } : {}));
  const toggle = moduleId => setOpen(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));

  return (
    <section className={`nw-modacc${tinted ? " nw-modacc--tinted" : ""}`} id={id}>
      <div className="nw-modacc__container">

        <header className="nw-modacc__header">
          <h2 className="nw-modacc__heading">
            {heading} <span className="nw-modacc__heading-accent">{headingAccent}</span>
          </h2>
          {lead && <p className="nw-modacc__lead">{lead}</p>}
        </header>

        <div className="nw-modacc__list">
          {modules.map(({ id: moduleId, title, Icon, bullets }) => {
            const isOpen = Boolean(open[moduleId]);
            return (
              <article className={`nw-modacc__item${isOpen ? " nw-open" : ""}`} key={moduleId}>
                <h3 className="nw-modacc__row">
                  <button
                    type="button"
                    className="nw-modacc__trigger"
                    id={`${id}-${moduleId}-trigger`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${moduleId}-region`}
                    onClick={() => toggle(moduleId)}
                  >
                    <span className="nw-modacc__icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.8} />
                    </span>
                    <span className="nw-modacc__title">{title}</span>
                    <span className="nw-modacc__count">{bullets.length}</span>
                    <ChevronDown size={17} strokeWidth={2.2} className="nw-modacc__chev" aria-hidden="true" />
                  </button>
                </h3>

                <div
                  className="nw-modacc__region"
                  id={`${id}-${moduleId}-region`}
                  role="region"
                  aria-labelledby={`${id}-${moduleId}-trigger`}
                >
                  <ul className="nw-modacc__bullets">
                    {bullets.map(bullet => (
                      <li className="nw-modacc__bullet" key={bullet}>
                        <span className="nw-modacc__tick" aria-hidden="true">
                          <Check size={10} strokeWidth={3.2} />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ModuleAccordion;
