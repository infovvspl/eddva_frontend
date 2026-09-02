// SolutionRoles.jsx — /solution
// "What we do for each of them" as an accordion rather than the tab rail this
// replaces: all four stakeholders stay on screen with their capability counts,
// and any number of them can be open at once.
//
// The tab version only ever showed one role, which made the four impossible to
// compare. Here the headers are always visible and each panel is independent —
// open Students and Teachers side by side and read down both.
//
// Each header is a real <button> with aria-expanded/aria-controls; the panel is
// a labelled region. Students is open on load so the section never reads as an
// empty list of headings.
//
// The capability list is the module inventory that actually ships in this repo
// — see data/solutions.js.

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { roleSolutions } from "../data/solutions";

const countFor = role =>
  role.groups.reduce((sum, group) => sum + group.items.length, 0);

const SolutionRoles = () => {
  const [open, setOpen] = useState({ [roleSolutions[0].id]: true });

  const toggle = id => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="nw-roles" id="nw-solution-roles">
      <div className="nw-roles__container">

        <header className="nw-roles__header">
          <h2 className="nw-roles__heading">What EDDVA Does for Each of Them</h2>
          <p className="nw-roles__lead">
            Every module below is live in the platform. Open a role to see
            exactly what they get.
          </p>
        </header>

        <div className="nw-roles__list">
          {roleSolutions.map(role => {
            const { id, title, blurb, Icon, color, bg, groups } = role;
            const isOpen = Boolean(open[id]);
            return (
              <article
                className={`nw-roles__item${isOpen ? " nw-open" : ""}`}
                key={id}
                id={id}
                style={{ "--nw-role-accent": color, "--nw-role-bg": bg }}
              >
                <h3 className="nw-roles__head">
                  <button
                    type="button"
                    className="nw-roles__trigger"
                    id={`${id}-trigger`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-region`}
                    onClick={() => toggle(id)}
                  >
                    <span className="nw-roles__icon" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span className="nw-roles__names">
                      <span className="nw-roles__title">{title}</span>
                      <span className="nw-roles__blurb">{blurb}</span>
                    </span>
                    <span className="nw-roles__count">{countFor(role)}</span>
                    <ChevronDown
                      size={19}
                      strokeWidth={2.2}
                      className="nw-roles__chev"
                      aria-hidden="true"
                    />
                  </button>
                </h3>

                <div
                  className="nw-roles__region"
                  id={`${id}-region`}
                  role="region"
                  aria-labelledby={`${id}-trigger`}
                  hidden={!isOpen}
                >
                  <div className="nw-roles__groups">
                    {groups.map(({ id: groupId, label, items }) => (
                      <div className="nw-roles__group" key={groupId}>
                        <h4 className="nw-roles__group-label">
                          {label}
                          <span className="nw-roles__group-count">{items.length}</span>
                        </h4>
                        <ul className="nw-roles__items">
                          {items.map(({ Icon: ItemIcon, name, desc }) => (
                            <li className="nw-roles__entry" key={name}>
                              <span className="nw-roles__entry-icon" aria-hidden="true">
                                <ItemIcon size={16} strokeWidth={1.9} />
                              </span>
                              <span className="nw-roles__entry-copy">
                                <span className="nw-roles__entry-name">{name}</span>
                                <span className="nw-roles__entry-desc">{desc}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default SolutionRoles;
