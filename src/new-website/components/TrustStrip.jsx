// TrustStrip.jsx — New Website Mockup
// Light blue band directly under the banner:
// "Everything Your Institution Needs" + six capability tiles.

import {
  School, Users, BarChart3, IndianRupee, Bell, ShieldCheck,
} from "lucide-react";

const items = [
  { id: "nw-trust-manage",    label: "School & Institute\nManagement", Icon: School },
  { id: "nw-trust-learning",  label: "Smart Learning\nManagement",     Icon: Users },
  { id: "nw-trust-analytics", label: "Advanced Analytics\n& Reports",  Icon: BarChart3 },
  { id: "nw-trust-finance",   label: "Fee & Finance\nManagement",      Icon: IndianRupee },
  { id: "nw-trust-comms",     label: "Communication\n& Notifications", Icon: Bell },
  { id: "nw-trust-secure",    label: "Secure &\nReliable",             Icon: ShieldCheck },
];

const TrustStrip = () => {
  return (
    <section className="nw-trust" id="nw-trust">
      <div className="nw-trust__container">

        <p className="nw-trust__title" id="nw-trust-title">
          Everything Your Institution Needs
        </p>

        <div className="nw-trust__row">
          {items.map(({ id, label, Icon }) => (
            <div className="nw-trust__item" key={id} id={id}>
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
