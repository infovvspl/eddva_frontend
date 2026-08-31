// ServicesSection.jsx — New Website Mockup
// OUR SERVICES + OUR STAKEHOLDERS in one band, stacked:
// the two service cards side by side, then the four stakeholder cards.

import { ArrowRight } from "lucide-react";
import { services, stakeholders } from "../data/services";


/* Decorative campus behind the section header. Drawn rather than imported —
   the illustration assets in src/assets have a transparency checkerboard
   baked into their pixels, so they cannot sit on a tinted background. */
const CampusScene = () => (
  <svg viewBox="0 0 420 230" className="nw-services__scene-svg" aria-hidden="true">
    <ellipse cx="120" cy="70" rx="34" ry="15" fill="#e8f0fc" />
    <ellipse cx="316" cy="58" rx="28" ry="13" fill="#e8f0fc" />
    <path d="M60 196h300" stroke="#dbe6f7" strokeWidth="2" strokeLinecap="round" />
    <g fill="#cfe0f7">
      <ellipse cx="86" cy="168" rx="17" ry="24" />
      <rect x="83" y="184" width="6" height="14" rx="3" fill="#bcd3f2" />
      <ellipse cx="338" cy="172" rx="15" ry="21" />
      <rect x="335" y="186" width="6" height="12" rx="3" fill="#bcd3f2" />
    </g>
    <rect x="116" y="128" width="52" height="68" rx="5" fill="#dfeafa" />
    <rect x="256" y="128" width="52" height="68" rx="5" fill="#dfeafa" />
    <rect x="160" y="96" width="104" height="100" rx="6" fill="#eaf2fd" />
    <path d="M212 44 168 96h88z" fill="#d2e2f8" />
    <circle cx="212" cy="80" r="9" fill="#fff" />
    <path d="M212 75v5l3 3" stroke="#9dbdea" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M212 44V22" stroke="#a9c6ee" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M212 24h22l-6 7 6 7h-22z" fill="#7fb0f2" />
    <g fill="#c6dbf6">
      <rect x="128" y="142" width="12" height="14" rx="2" />
      <rect x="146" y="142" width="12" height="14" rx="2" />
      <rect x="128" y="164" width="12" height="14" rx="2" />
      <rect x="146" y="164" width="12" height="14" rx="2" />
      <rect x="266" y="142" width="12" height="14" rx="2" />
      <rect x="284" y="142" width="12" height="14" rx="2" />
      <rect x="266" y="164" width="12" height="14" rx="2" />
      <rect x="284" y="164" width="12" height="14" rx="2" />
      <rect x="176" y="112" width="14" height="16" rx="2" />
      <rect x="234" y="112" width="14" height="16" rx="2" />
    </g>
    <path d="M198 196v-38a14 14 0 0 1 28 0v38z" fill="#c6dbf6" />
  </svg>
);

const ServicesSection = () => {
  return (
    <section className="nw-services" id="nw-solution">
      <div className="nw-services__container">

        {/* Header — intro copy with the campus scene alongside */}
        <div className="nw-services__head">
          <div className="nw-services__intro">
            <span className="nw-services__label nw-services__label--rule">OUR SERVICES</span>
            <h2 className="nw-services__heading">
              Tailored <span className="nw-services__heading-accent">for Institutions</span>
            </h2>
            <p className="nw-services__lead">
              Powerful solutions designed to simplify operations, drive
              engagement and deliver academic excellence.
            </p>
          </div>
          <div className="nw-services__scene" aria-hidden="true">
            <CampusScene />
          </div>
        </div>

        {/* Services */}
        <div className="nw-services__list">
          {services.map(({ id, title, desc, Icon, color, bg }) => (
            <div
              className="nw-services__item"
              key={id}
              id={id}
              style={{ "--nw-svc-accent": color }}
            >
              <div className="nw-services__item-icon" style={{ background: bg, color }}>
                <Icon size={36} />
              </div>
              <div className="nw-services__item-copy">
                <h4 className="nw-services__item-title">{title}</h4>
                <p className="nw-services__item-desc">{desc}</p>
              </div>
              <span className="nw-services__item-go" aria-hidden="true">
                <ArrowRight size={17} strokeWidth={2.2} />
              </span>
            </div>
          ))}
        </div>

        {/* Stakeholders */}
        <div className="nw-services__right">
          <span className="nw-services__label nw-services__label--center">OUR STAKEHOLDERS</span>
          <div className="nw-services__stakeholders">
            {stakeholders.map(({ id, title, desc, Icon, color, bg }) => (
              <div
                className="nw-services__sh-card"
                key={id}
                id={id}
                style={{ "--nw-sh-accent": color }}
              >
                <div className="nw-services__sh-avatar" style={{ background: bg, color }}>
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <h4 className="nw-services__sh-title">{title}</h4>
                <p className="nw-services__sh-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
