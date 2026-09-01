// SolutionDetail.jsx — /solution
// "What we do for each stakeholder", in depth: a role rail on the left, the
// selected role's full capability set on the right, grouped by job.
//
// The capability list is not marketing invention — it is the module inventory
// that actually ships in this repo (see data/solutions.js, which maps each
// item to a real route in src/App.tsx).
//
// The rail is a real tablist: arrow keys and Home/End move between roles, and
// only the active tab is in the tab order.

import { useRef, useState } from "react";
import { roleSolutions } from "../data/solutions";

const SolutionDetail = () => {
  const [activeId, setActiveId] = useState(roleSolutions[0].id);
  const tabRefs = useRef({});

  const activeIndex = roleSolutions.findIndex(r => r.id === activeId);
  const role = roleSolutions[activeIndex];
  const total = role.groups.reduce((sum, g) => sum + g.items.length, 0);

  const focusTab = index => {
    const next = roleSolutions[(index + roleSolutions.length) % roleSolutions.length];
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const onKeyDown = event => {
    const keys = {
      ArrowDown: activeIndex + 1,
      ArrowRight: activeIndex + 1,
      ArrowUp: activeIndex - 1,
      ArrowLeft: activeIndex - 1,
      Home: 0,
      End: roleSolutions.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    focusTab(keys[event.key]);
  };

  return (
    <section className="nw-detail" id="nw-solution-detail">
      <div className="nw-detail__container">

        <header className="nw-detail__header">
          <h2 className="nw-detail__heading">What EDDVA Does for Each of Them</h2>
          <p className="nw-detail__lead">
            Every module below is live in the platform. Pick a role to see
            exactly what they get.
          </p>
        </header>

        <div className="nw-detail__layout">

          {/* ── Role rail ── */}
          <div
            className="nw-detail__rail"
            role="tablist"
            aria-label="Stakeholder"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
          >
            {roleSolutions.map(({ id, title, Icon, color, bg, groups }) => {
              const selected = id === activeId;
              const count = groups.reduce((sum, g) => sum + g.items.length, 0);
              return (
                <button
                  type="button"
                  key={id}
                  id={`${id}-tab`}
                  ref={el => { tabRefs.current[id] = el; }}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={`nw-detail__tab${selected ? " nw-detail__tab--on" : ""}`}
                  style={{ "--nw-role-accent": color, "--nw-role-bg": bg }}
                  onClick={() => setActiveId(id)}
                >
                  <span className="nw-detail__tab-icon" aria-hidden="true">
                    <Icon size={21} strokeWidth={1.8} />
                  </span>
                  <span className="nw-detail__tab-copy">
                    <span className="nw-detail__tab-title">{title}</span>
                    <span className="nw-detail__tab-count">{count} capabilities</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Selected role ── */}
          <div
            className="nw-detail__panel"
            id={`${role.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${role.id}-tab`}
            key={role.id}
            style={{ "--nw-role-accent": role.color, "--nw-role-bg": role.bg }}
          >
            <div className="nw-detail__panel-head">
              <span className="nw-detail__panel-icon" aria-hidden="true">
                <role.Icon size={26} strokeWidth={1.8} />
              </span>
              <div className="nw-detail__panel-copy">
                <h3 className="nw-detail__panel-title">
                  What we do for {role.title.toLowerCase()}
                </h3>
                <p className="nw-detail__panel-blurb">{role.blurb}</p>
              </div>
              <span className="nw-detail__panel-total">{total}</span>
            </div>

            {role.groups.map(({ id, label, items }) => (
              <div className="nw-detail__group" key={id}>
                <h4 className="nw-detail__group-label">
                  {label}
                  <span className="nw-detail__group-count">{items.length}</span>
                </h4>
                <ul className="nw-detail__items">
                  {items.map(({ Icon, name, desc }) => (
                    <li className="nw-detail__item" key={name}>
                      <span className="nw-detail__item-icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <div className="nw-detail__item-copy">
                        <span className="nw-detail__item-name">{name}</span>
                        <span className="nw-detail__item-desc">{desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default SolutionDetail;
