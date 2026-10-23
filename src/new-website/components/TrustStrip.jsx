// TrustStrip.jsx — New Website Mockup
// Light blue band directly under the banner:
// "Everything Your Institution Needs" + six capability tiles.

import {
  School, BrainCircuit, Database, BarChart3, Users, ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";

const items = [
  { id: "nw-trust-manage",    Icon: School },
  { id: "nw-trust-ai",        Icon: BrainCircuit },
  { id: "nw-trust-erp",       Icon: Database },
  { id: "nw-trust-analytics", Icon: BarChart3 },
  { id: "nw-trust-parent",    Icon: Users },
  { id: "nw-trust-secure",    Icon: ShieldCheck },
];

const TrustStrip = () => {
  const { t } = useTranslation("home");
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="nw-trust" id="nw-trust">
      <div className="nw-trust__container">

        <p className="nw-trust__title" id="nw-trust-title">
          {t("trust.title")}
        </p>
        <p className="nw-trust__tagline" id="nw-trust-tagline">
          {t("trust.tagline")}
        </p>

        <div className={`nw-trust__row${inView ? " nw-in" : ""}`} ref={ref}>
          {items.map(({ id, Icon }, i) => (
            <div className="nw-trust__item" key={id} id={id} style={{ "--i": i }}>
              <span className="nw-trust__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} />
              </span>
              <span className="nw-trust__label" style={{ whiteSpace: "pre-line" }}>
                {t(`trust.items.${id}`)}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrustStrip;
