// RoleDetail.jsx — /solution/teachers and /solution/students
// The full-page version of a stakeholder's capability breakdown: everything
// expanded, nothing collapsed — unlike the hub's SolutionRoles accordion,
// where the same content sits squeezed among three other roles.
//
// Takes one entry from data/solutions.js `roleSolutions` and renders it as a
// dedicated page's main content, group by group.

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useInView from "../hooks/useInView";

const countFor = role =>
  role.groups.reduce((sum, group) => sum + group.items.length, 0);

const RoleDetail = ({ role }) => {
  const { title, blurb, Icon, color, bg, groups } = role;
  const [ref, inView] = useInView({ threshold: 0.05 });
  const total = countFor(role);

  return (
    <section className="nw-roledet" id="nw-role-detail" style={{ "--nw-role-accent": color, "--nw-role-bg": bg }}>
      <div className="nw-roledet__container">

        <header className="nw-roledet__header">
          <span className="nw-roledet__icon" aria-hidden="true">
            <Icon size={30} strokeWidth={1.7} />
          </span>
          <h1 className="nw-roledet__title">What EDDVA Does for {title}</h1>
          <p className="nw-roledet__blurb">{blurb}</p>
          <span className="nw-roledet__total">{total} capabilities, live in the platform</span>
        </header>

        <div className={`nw-roledet__groups${inView ? " nw-in" : ""}`} ref={ref}>
          {groups.map(({ id: groupId, label, items }, gi) => (
            <div className="nw-roledet__group" key={groupId} style={{ "--i": gi }}>
              <h2 className="nw-roledet__group-label">
                {label}
                <span className="nw-roledet__group-count">{items.length}</span>
              </h2>
              <ul className="nw-roledet__items">
                {items.map(({ Icon: ItemIcon, name, desc }) => (
                  <li className="nw-roledet__entry" key={name}>
                    <span className="nw-roledet__entry-icon" aria-hidden="true">
                      <ItemIcon size={18} strokeWidth={1.9} />
                    </span>
                    <span className="nw-roledet__entry-copy">
                      <span className="nw-roledet__entry-name">{name}</span>
                      <span className="nw-roledet__entry-desc">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="nw-roledet__cta-card">
          <div>
            <h3 className="nw-roledet__cta-title">See it on your own {title.toLowerCase()}</h3>
            <p className="nw-roledet__cta-desc">
              We will walk through these modules against your institution's own setup.
            </p>
          </div>
          <Link to="/contact" className="nw-roledet__cta" id="nw-role-detail-cta">
            Book a demo
            <ArrowRight size={15} strokeWidth={2.6} />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default RoleDetail;
