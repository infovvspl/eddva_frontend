// TransformSection.jsx — New Website Mockup

const features = [
  {
    id: "nw-feature-ai",
    label: "AI-Powered\nLearning",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: "nw-feature-auto",
    label: "Smart\nAutomation",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
  {
    id: "nw-feature-secure",
    label: "Secure &\nScalable",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    id: "nw-feature-data",
    label: "Data-Driven\nInsights",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <polyline points="2 20 22 20"/>
        <polyline points="8 10 12 6 16 10"/>
      </svg>
    ),
  },
];

const TransformSection = () => {
  return (
    <section className="nw-transform" id="nw-transform">
      <div className="nw-transform__container">

        {/* Heading */}
        <h2 className="nw-transform__heading">
          Transforming Education<br />
          with{" "}
          <span className="nw-transform__heading--accent">AI-Powered Solutions</span>
        </h2>

        {/* Subtext */}
        <p className="nw-transform__sub">
          EDDVA is an all-in-one digital platform for Schools &amp; Institutes<br />
          to manage, teach, learn and grow &ndash; smarter, together.
        </p>

        {/* Feature badges */}
        <div className="nw-transform__features">
          {features.map(f => (
            <div className="nw-transform__feature" key={f.id} id={f.id}>
              <div className="nw-transform__feature-icon">{f.icon}</div>
              <span className="nw-transform__feature-label" style={{ whiteSpace: "pre-line" }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="nw-transform__actions">
          <a href="#nw-demo"    className="nw-transform__btn--filled"   id="nw-btn-demo">Book a Free Demo</a>
          <a href="#nw-product" className="nw-transform__btn--outlined" id="nw-btn-explore">Explore Products</a>
        </div>

      </div>
    </section>
  );
};

export default TransformSection;
