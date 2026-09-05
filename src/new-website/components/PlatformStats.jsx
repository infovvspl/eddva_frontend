// PlatformStats.jsx — /about
// "The platform, by the numbers" — four counts pulled straight from the data
// that actually ships (data/products, data/erpModules, data/lmsModules,
// data/solutions), not written copy. Gives the About page a second, denser
// layer under the editorial pillars above, without inventing any prose.

import { Package, Layers, Sparkles, Users } from "lucide-react";
import { products } from "../data/products";
import { erpModules } from "../data/erpModules";
import { lmsModules } from "../data/lmsModules";
import { features } from "../data/features";
import { roleSolutions } from "../data/solutions";
import useInView from "../hooks/useInView";
import useCountUp from "../hooks/useCountUp";

const stats = [
  { id: "nw-pstat-products", Icon: Package, value: products.length, label: "Products" },
  { id: "nw-pstat-modules",  Icon: Layers,  value: erpModules.length + lmsModules.length, label: "ERP + AI Learn Modules" },
  { id: "nw-pstat-features", Icon: Sparkles, value: features.length, label: "AI-Powered Features" },
  { id: "nw-pstat-roles",    Icon: Users,   value: roleSolutions.length, label: "Stakeholder Roles Covered" },
];

const StatCard = ({ id, Icon, value, label, index, run }) => {
  const count = useCountUp(value, run);
  return (
    <div className="nw-pstats__card" id={id} style={{ "--i": index }}>
      <span className="nw-pstats__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="nw-pstats__value">{count}</span>
      <span className="nw-pstats__label">{label}</span>
    </div>
  );
};

const PlatformStats = () => {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="nw-pstats" id="nw-platform-stats" ref={ref}>
      <div className="nw-pstats__container">
        <header className="nw-pstats__header">
          <span className="nw-section-label">The Platform</span>
          <h2 className="nw-pstats__heading">EDDVA, by the Numbers</h2>
        </header>

        <div className={`nw-pstats__grid${inView ? " nw-in" : ""}`}>
          {stats.map((stat, i) => (
            <StatCard key={stat.id} {...stat} index={i} run={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
