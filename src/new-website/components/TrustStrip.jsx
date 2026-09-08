// TrustStrip.jsx — New Website Mockup
// Light blue band directly under the banner:
// "Everything Your Institution Needs" + six capability tiles.

import {
  School, BrainCircuit, Database, BarChart3, Users, ShieldCheck,
} from "lucide-react";
import useInView from "../hooks/useInView";

const items = [
  { id: "nw-trust-manage",    label: "School & Institute\nManagement", Icon: School },
  { id: "nw-trust-ai",        label: "AI Learning\nEcosystem",         Icon: BrainCircuit },
  { id: "nw-trust-erp",       label: "Smart School\nERP",              Icon: Database },
  { id: "nw-trust-analytics", label: "Advanced Analytics\n& Reports",  Icon: BarChart3 },
  { id: "nw-trust-parent",    label: "Parent\nConnect",                Icon: Users },
  { id: "nw-trust-secure",    label: "Secure &\nReliable",             Icon: ShieldCheck },
];

const TrustStrip = () => {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="nw-trust" id="nw-trust">
      <div className="nw-trust__container">

        <p className="nw-trust__title" id="nw-trust-title">
          Everything Your Institution Needs
        </p>
        <p className="nw-trust__tagline" id="nw-trust-tagline">
          Built for Better Learning. Designed for Smarter Institutions.
        </p>

        <div className={`nw-trust__row${inView ? " nw-in" : ""}`} ref={ref}>
          {items.map(({ id, label, Icon }, i) => (
            <div className="nw-trust__item" key={id} id={id} style={{ "--i": i }}>
              <span className="nw-trust__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} />
              </span>
              <span className="nw-trust__label" style={{ whiteSpace: "pre-line" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrustStrip;
