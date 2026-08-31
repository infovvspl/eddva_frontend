// PricingSection.jsx — New Website Mockup
// Body of the /new-website/pricing page.
//
// ⚠ PLACEHOLDER COMMERCIALS. `price` is null on every plan, which renders
// "Custom" and a "Request a quote" CTA — no figure is invented here. To show
// real numbers, set `price` to the amount and `cycle` to the billing period
// ("₹4,999" / "per month") and the card renders them automatically.
// Tier names and feature bullets describe capabilities already stated
// elsewhere on the site; confirm the tier boundaries before going live.

import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    id: "nw-price-starter",
    name: "Starter",
    tagline: "For a single school finding its feet online.",
    price: null,
    cycle: null,
    accent: "#1a56db",
    bg: "#eff6ff",
    featured: false,
    features: [
      "Learning management system",
      "Attendance and timetable",
      "Parent and teacher communication",
      "Student and staff records",
      "Email support",
    ],
  },
  {
    id: "nw-price-growth",
    name: "Growth",
    tagline: "For multi-branch schools and coaching institutes.",
    price: null,
    cycle: null,
    accent: "#7c3aed",
    bg: "#f5f3ff",
    featured: true,
    features: [
      "Everything in Starter",
      "Full ERP — fees, admissions, payroll",
      "AI-generated notes and assessments",
      "Live and auto-recorded classes",
      "Analytics and reporting dashboards",
      "Priority support",
    ],
  },
  {
    id: "nw-price-enterprise",
    name: "Enterprise",
    tagline: "For institution groups running at scale.",
    price: null,
    cycle: null,
    accent: "#0891b2",
    bg: "#ecfeff",
    featured: false,
    features: [
      "Everything in Growth",
      "Multi-campus administration",
      "Custom integrations and data migration",
      "Role-based access controls",
      "Dedicated onboarding and account manager",
    ],
  },
];

const PricingSection = () => {
  return (
    <section className="nw-pricing" id="nw-pricing">
      <div className="nw-pricing__container">

        <header className="nw-pricing__header">
          <h2 className="nw-pricing__heading">Plans That Grow With You</h2>
          <p className="nw-pricing__lead">
            Every plan runs on the same platform — academics, administration
            and analytics in one place. Pick the scope that matches your
            institution and move up whenever you need to.
          </p>
        </header>

        <div className="nw-pricing__grid" id="nw-pricing-grid">
          {plans.map(({ id, name, tagline, price, cycle, accent, bg, featured, features }) => (
            <article
              className={`nw-pricing__card${featured ? " nw-pricing__card--featured" : ""}`}
              key={id}
              id={id}
              style={{ "--nw-price-accent": accent, "--nw-price-bg": bg }}
            >
              {featured && (
                <span className="nw-pricing__flag">
                  <Sparkles size={13} strokeWidth={2.2} />
                  Most Popular
                </span>
              )}

              <h3 className="nw-pricing__name">{name}</h3>
              <p className="nw-pricing__tagline">{tagline}</p>

              <p className="nw-pricing__amount">
                {price ? (
                  <>
                    <span className="nw-pricing__figure">{price}</span>
                    {cycle && <span className="nw-pricing__cycle">{cycle}</span>}
                  </>
                ) : (
                  <>
                    <span className="nw-pricing__figure">Custom</span>
                    <span className="nw-pricing__cycle">priced to your institution</span>
                  </>
                )}
              </p>

              <ul className="nw-pricing__features">
                {features.map(feature => (
                  <li className="nw-pricing__feature" key={feature}>
                    <span className="nw-pricing__tick" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/new-website/contact"
                className={`nw-pricing__cta${featured ? " nw-pricing__cta--filled" : ""}`}
                id={`${id}-cta`}
              >
                Request a quote
              </Link>
            </article>
          ))}
        </div>

        <p className="nw-pricing__note">
          Not sure which plan fits? Book a free demo and we will map your
          requirements to the right tier.
        </p>

      </div>
    </section>
  );
};

export default PricingSection;
